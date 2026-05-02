import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
}

export function Logo({ variant = "light", className }: LogoProps) {
  const src =
    variant === "dark"
      ? "/images/logo-base-transparente.png"
      : "/images/logo-base.png";

  return (
    <Link href="/" className={cn("inline-flex items-center shrink-0", className)}>
      <Image
        src={src}
        alt="RC2 Soluções"
        width={120}
        height={40}
        priority
        className="h-10 w-auto"
      />
    </Link>
  );
}
