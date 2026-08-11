import { Star } from "lucide-react";

// Avaliações fixas exibidas na home (conteúdo estático, sem query dinâmica).
// A consulta dinâmica ao Google fica restrita à página /avaliacoes.
const reviews = [
  {
    name: "Luana Gonçalves",
    date: "06/05/2026",
    rating: 5,
    text: "A RC2 Soluções é uma excelente escolha para empresas que desejam modernizar sua operação, automatizar processos e utilizar IA de forma estratégica e aplicada ao negócio. Ideal para quem busca sair do operacional manual e ganhar escala com inteligência.",
  },
  {
    name: "Nelson Jose Dias Mello",
    date: "06/05/2026",
    rating: 5,
    text: "Finalmente uma consultoria que não vende 'hype' de IA, mas aplicação real. A RC2 implementou automações que reduziram drasticamente nosso trabalho operacional. O suporte é técnico de alto nível e a entrega é focada em performance",
  },
  {
    name: "Brenda Araujo",
    date: "13/05/2026",
    rating: 5,
    text: "Quero agradecer a RC2 por todo auxilio para minha empresa e para a empresa de meus familiares. A automatização dos nossos atendimentos foi um ponto chave para melhorar nossos serviços. A RC2 foi muito prestativa em responder toda e qualquer dúvida, suporte impecável. Parabéns!",
  },
  {
    name: "Ellen Luisa Lima",
    date: "11/05/2026",
    rating: 5,
    text: "Experiência excelente com a RC2 Soluções! Atendimento rápido, equipe atenciosa e soluções eficientes. Dá para perceber o cuidado e a dedicação em cada detalhe do serviço. Empresa confiável e muito profissional. Recomendo fortemente!",
  },
];

export function HomeReviews() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {reviews.map((review) => (
        <figure
          key={review.name}
          className="group rc2-card rc2-card-hover relative flex flex-col overflow-hidden p-6 pt-7"
        >
          {/* Acento estrutural — aba laranja no topo */}
          <span
            className="absolute left-0 top-0 h-1 w-10 bg-rc2-brand transition-all duration-200 group-hover:w-full group-hover:opacity-90"
            aria-hidden
          />
          <div
            className="mb-3 flex items-center gap-0.5"
            aria-label={`${review.rating} de 5 estrelas`}
          >
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={15}
                className={i < review.rating ? "fill-rc2-brand text-rc2-brand" : "text-rc2-text/20"}
                aria-hidden
              />
            ))}
          </div>
          <blockquote className="flex-1 text-sm leading-relaxed text-rc2-text/80">
            {review.text}
          </blockquote>
          <figcaption className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold text-rc2-heading">{review.name}</span>
            <time className="text-xs text-rc2-text-secondary">{review.date}</time>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
