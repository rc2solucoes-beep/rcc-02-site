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
  className?: string;
}

export function Logo({ variant = "light", className }: LogoProps) {
  const src =
    variant === "dark"
      ? "/images/logo-base-transparente-branco.png"
      : "/images/logo-base-transparente-preto.png";

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
