import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

// Extensões válidas → MIME canônico
const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Verifica se o usuário autenticado é admin */
async function getAdminSession() {
  const supabase = await createSessionClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", session.user.id)
    .single();

  return adminUser ? session : null;
}

/** Sanitiza o nome do arquivo para uso seguro no path do Blob */
function sanitizeFilename(raw: string): string {
  const ext = raw.split(".").pop()?.toLowerCase() ?? "jpg";
  const name = raw
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${name || "imagem"}.${ext}`;
}

/** Resolve o MIME type canonicamente — usa Content-Type e cai no filename como fallback */
function resolveMime(contentTypeHeader: string, filename: string): string | null {
  // Tenta o Content-Type enviado pelo browser
  const fromHeader = contentTypeHeader.split(";")[0].trim().toLowerCase();
  if (fromHeader.startsWith("image/")) return fromHeader;

  // Fallback: extensão do filename
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Autenticação
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // 2. Parâmetros da query
  const { searchParams } = new URL(request.url);
  const rawFilename = searchParams.get("filename") ?? "imagem.jpg";
  const folder = searchParams.get("folder") ?? "blog";

  // 3. Resolver MIME type (Content-Type header + fallback por extensão)
  const contentTypeHeader = request.headers.get("content-type") ?? "";
  const mimeType = resolveMime(contentTypeHeader, rawFilename);

  if (!mimeType) {
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
    return NextResponse.json({ error: "Não foi possível ler o arquivo." }, { status: 400 });
  }

  // 5. Validar tamanho
  if (buffer.byteLength > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Arquivo muito grande. Máximo: ${MAX_SIZE_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  if (buffer.byteLength === 0) {
    return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
  }

  // 6. Gerar path único
  const sanitized = sanitizeFilename(rawFilename);
  const blobPath = `${folder}/${Date.now()}-${sanitized}`;

  // 7. Upload para Vercel Blob
  try {
    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: mimeType,
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    console.error("[/api/upload] Erro no Vercel Blob:", err);
    return NextResponse.json(
      { error: "Erro ao fazer upload. Tente novamente." },
      { status: 500 }
    );
  }
}
