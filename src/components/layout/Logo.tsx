import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  /**
   * Descreve o fundo onde o logo será renderizado, não a cor do logo:
   * `light` indica fundo claro e renderiza o logo preto; `dark` indica fundo
   * navy e renderiza o logo branco.
   */
  variant?: "light" | "dark";
  /**
   * Opt-in (cabeçalho e rodapé): enquadra a área útil do PNG (sem alterá-lo)
   * em um wrapper de largura óptica definida por `--rc2-logo-useful`. Sem a
   * prop, a aplicação é a de sempre.
   */
  crop?: boolean;
  /**
   * Só vale com `crop`. Padrão `true` (cabeçalho). O rodapé passa `false`
   * para não priorizar o asset abaixo da dobra.
   */
  preloadImage?: boolean;
  className?: string;
}

export function Logo({
  variant = "light",
  crop = false,
  preloadImage = true,
  className,
}: LogoProps) {
  const src =
    variant === "dark"
      ? "/images/logo-base-transparente-branco.png"
      : "/images/logo-base-transparente-preto.png";

  if (crop) {
    return (
      <Link href="/" className={cn("rc2-logo-crop", className)}>
        <span className="rc2-logo-crop__frame">
          {/* `preload` substitui `priority`, deprecado no Next 16. O `sizes`
              acompanha a largura do quadro (≈124px desktop, ≈102px mobile). */}
          <Image
            src={src}
            alt="RC2 Soluções"
            width={1491}
            height={1055}
            preload={preloadImage}
            sizes="(min-width: 1024px) 124px, 102px"
            unoptimized={variant === "dark"}
          />
        </span>
      </Link>
    );
  }

  return (
    <Link href="/" className={cn("inline-flex items-center shrink-0", className)}>
      <Image
        src={src}
        alt="RC2 Soluções"
        width={1491}
        height={1055}
        priority
        className="h-10 w-auto"
      />
    </Link>
  );
}
