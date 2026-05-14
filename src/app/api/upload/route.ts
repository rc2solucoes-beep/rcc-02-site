import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
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
    .replace(/\.[^.]+$/, "")           // remove extensão
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")       // só letras, números e hifens
    .replace(/^-+|-+$/g, "")           // remove hifens nas pontas
    .slice(0, 60);                     // limita o tamanho
  return `${name || "imagem"}.${ext}`;
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
  const folder = searchParams.get("folder") ?? "blog"; // blog | og | misc

  // 3. Validar Content-Type
  const contentType = request.headers.get("content-type") ?? "";
  const mimeType = contentType.split(";")[0].trim();
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: `Tipo de arquivo não permitido: ${mimeType}. Use JPEG, PNG, WebP ou GIF.` },
      { status: 400 }
    );
  }

  // 4. Validar tamanho (via Content-Length)
  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Arquivo muito grande. Máximo: ${MAX_SIZE_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  // 5. Gerar path único: blog/covers/1736000000000-nome-do-arquivo.jpg
  const sanitized = sanitizeFilename(rawFilename);
  const timestamp = Date.now();
  const blobPath = `${folder}/${timestamp}-${sanitized}`;

  // 6. Upload para Vercel Blob
  try {
    const blob = await put(blobPath, request.body!, {
      access: "public",
      contentType: mimeType,
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    console.error("[/api/upload] Erro no upload:", err);
    return NextResponse.json(
      { error: "Erro ao fazer upload. Tente novamente." },
      { status: 500 }
    );
  }
}
