import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { extractRequestContext, writeAdminAuditLog } from "@/lib/admin/auditLog";
import { requireAdmin } from "@/lib/admin/requireAdmin";

// Extensões válidas → MIME canônico
const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const ALLOWED_MIME_TYPES = new Set(Object.keys(MIME_TO_EXT));

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function getBasename(raw: string): string {
  return raw.replace(/\\/g, "/").split("/").pop() ?? "";
}

function getAllowedExtension(raw: string): string | null {
  const basename = getBasename(raw);
  const ext = basename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ? ext : null;
}

/** Sanitiza o nome do arquivo para uso seguro no path do Blob */
function sanitizeFilename(raw: string, mimeType: string): string {
  const basename = getBasename(raw);
  const ext = getAllowedExtension(basename) ?? MIME_TO_EXT[mimeType];
  const name = basename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${name || "imagem"}.${ext}`;
}

function sanitizeFolder(raw: string): string {
  const sanitized = raw
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) =>
      segment
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40)
    )
    .filter(Boolean)
    .join("/");

  return sanitized || "blog";
}

/** Resolve o MIME type canonicamente — usa Content-Type e cai no filename como fallback */
function resolveMime(contentTypeHeader: string, filename: string): string | null {
  const fromHeader = contentTypeHeader.split(";")[0].trim().toLowerCase();
  if (fromHeader) {
    return ALLOWED_MIME_TYPES.has(fromHeader) ? fromHeader : null;
  }

  const ext = getAllowedExtension(filename);
  return ext ? EXT_TO_MIME[ext] : null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestContext = extractRequestContext(request);

  // 1. Autenticação
  const admin = await requireAdmin();
  if (!admin.ok) {
    if (admin.status === 401) {
      console.warn("[/api/upload] Access denied: no active session");
      await writeAdminAuditLog({
        event: "admin_upload_denied_no_session",
        severity: "warning",
        actorType: "unknown",
        path: requestContext.path,
        method: requestContext.method,
        status: 401,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      });
    } else {
      console.warn("[/api/upload] Access denied: user is not an admin");
      await writeAdminAuditLog({
        event: "admin_upload_denied_not_admin",
        severity: "warning",
        actorUserId: admin.userId,
        actorEmail: admin.email,
        actorType: "authenticated",
        path: requestContext.path,
        method: requestContext.method,
        status: 403,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      });
    }

    return NextResponse.json({ error: "Não autorizado" }, { status: admin.status });
  }

  // 2. Parâmetros da query
  const { searchParams } = new URL(request.url);
  const rawFilename = searchParams.get("filename") ?? "imagem.jpg";
  const folder = sanitizeFolder(searchParams.get("folder") ?? "blog");

  // 3. Resolver MIME type (Content-Type header + fallback por extensão)
  const contentTypeHeader = request.headers.get("content-type") ?? "";
  const mimeType = resolveMime(contentTypeHeader, rawFilename);

  if (!mimeType) {
    await writeAdminAuditLog({
      event: "admin_upload_invalid_mime",
      severity: "warning",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: requestContext.path,
      method: requestContext.method,
      status: 400,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      metadata: {
        filename: rawFilename,
        contentTypeHeader,
      },
    });
    return NextResponse.json(
      { error: "Tipo de arquivo não suportado. Use JPEG, PNG, WebP, GIF ou AVIF." },
      { status: 400 }
    );
  }

  // 4. Ler body como ArrayBuffer (mais confiável que request.body stream)
  let buffer: ArrayBuffer;
  try {
    buffer = await request.arrayBuffer();
  } catch {
    await writeAdminAuditLog({
      event: "admin_upload_read_error",
      severity: "warning",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: requestContext.path,
      method: requestContext.method,
      status: 400,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      metadata: {
        filename: rawFilename,
      },
    });
    return NextResponse.json({ error: "Não foi possível ler o arquivo." }, { status: 400 });
  }

  // 5. Validar tamanho
  if (buffer.byteLength > MAX_SIZE_BYTES) {
    await writeAdminAuditLog({
      event: "admin_upload_too_large",
      severity: "warning",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: requestContext.path,
      method: requestContext.method,
      status: 413,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      metadata: {
        filename: rawFilename,
        sizeBytes: buffer.byteLength,
      },
    });
    return NextResponse.json(
      { error: `Arquivo muito grande. Máximo: ${MAX_SIZE_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  if (buffer.byteLength === 0) {
    await writeAdminAuditLog({
      event: "admin_upload_empty_file",
      severity: "warning",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: requestContext.path,
      method: requestContext.method,
      status: 400,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      metadata: {
        filename: rawFilename,
      },
    });
    return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
  }

  // 6. Gerar path único
  const sanitized = sanitizeFilename(rawFilename, mimeType);
  const blobPath = `${folder}/${Date.now()}-${sanitized}`;

  // 7. Upload para Vercel Blob
  try {
    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: mimeType,
    });

    await writeAdminAuditLog({
      event: "admin_upload_success",
      severity: "info",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: requestContext.path,
      method: requestContext.method,
      status: 200,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      resourceType: "blob",
      resourceId: blob.pathname,
      metadata: {
        filename: rawFilename,
        folder,
        mimeType,
        sizeBytes: buffer.byteLength,
      },
    });
    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    console.error("[/api/upload] Erro no Vercel Blob:", err);
    await writeAdminAuditLog({
      event: "admin_upload_storage_error",
      severity: "error",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: requestContext.path,
      method: requestContext.method,
      status: 500,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      metadata: {
        filename: rawFilename,
        folder,
        mimeType,
      },
    });
    return NextResponse.json(
      { error: "Erro ao fazer upload. Tente novamente." },
      { status: 500 }
    );
  }
}
