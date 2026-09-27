import type { Metadata } from "next";

// Post inexistente (ou preview sem acesso): mesma UI do 404 global, mas sem
// herdar do layout raiz o canonical da Home e o `index, follow` — que
// contradiriam o `noindex` que o Next injeta na resposta 404.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export { default } from "@/app/not-found";
