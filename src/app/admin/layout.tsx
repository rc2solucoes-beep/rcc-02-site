import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — RC2 Soluções",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
