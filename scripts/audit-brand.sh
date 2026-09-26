#!/usr/bin/env bash
# Auditoria de conformidade com o Brand Guide RC2 v3.
# Falha se encontrar valores da paleta descontinuada ou hex literal em componente.
# Uso: npm run audit:brand

set -uo pipefail

DIRS="${DIRS:-app src components pages styles lib}"
EXTS="--include=*.tsx --include=*.jsx --include=*.ts --include=*.js --include=*.css --include=*.scss --include=*.html"
EXCLUDE="--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=admin"

SEARCH_DIRS=""
for d in $DIRS; do [ -d "$d" ] && SEARCH_DIRS="$SEARCH_DIRS $d"; done
if [ -z "$SEARCH_DIRS" ]; then echo "Nenhum diretório de código encontrado. Ajuste DIRS."; exit 1; fi

FAIL=0
RED=$'\033[0;31m'; YEL=$'\033[0;33m'; GRN=$'\033[0;32m'; DIM=$'\033[2m'; OFF=$'\033[0m'

check() {
  local label="$1" pattern="$2" level="$3"
  local hits
  hits=$(grep -rniE $EXTS $EXCLUDE "$pattern" $SEARCH_DIRS 2>/dev/null || true)
  if [ -n "$hits" ]; then
    if [ "$level" = "erro" ]; then
      printf '%s✗ %s%s\n' "$RED" "$label" "$OFF"; FAIL=1
    else
      printf '%s! %s%s\n' "$YEL" "$label" "$OFF"
    fi
    printf '%s%s%s\n\n' "$DIM" "$(echo "$hits" | head -12)" "$OFF"
  fi
}

echo "── Paleta descontinuada (v2 High-End Tool) ──"
check "Areia Industrial #F5F0E8"  '#F5F0E8'  erro
check "Ink Black #121212"          '#121212'  erro
check "Ébano Quente #1E1610"       '#1E1610'  erro
check "Deep Forest #163020"        '#163020'  erro
check "theme-color legado #0D0D0F" '#0D0D0F'  erro

echo "── Valores proibidos ──"
check "Preto puro — use #0B1726"   '#000000|#000\b|black' erro
check "Tons frios proibidos"       '#[0-9a-f]*(purple|violet|indigo|cyan)' aviso
check "Gradiente colorido"         'linear-gradient|radial-gradient'        aviso

echo "── Acessibilidade ──"
check "outline none sem substituto" "outline:?\s*['\"]?(none|0)[^-]"          erro
check "Texto branco sobre laranja"  '(bg-brand|#FF5F1F)[^;]*text-white|text-white[^;]*bg-brand' erro

echo "── Hex literal fora dos tokens ──"
hits=$(grep -rniE $EXTS $EXCLUDE --exclude=globals.css '#[0-9a-fA-F]{6}\b' $SEARCH_DIRS 2>/dev/null || true)
[ -n "$hits" ] && printf '%s! Hex hardcoded em componente%s\n%s%s%s\n\n' "$YEL" "$OFF" "$DIM" "$(echo "$hits" | head -12)" "$OFF"

# ── Governança (AGENTS.md) ──
# Só regras provadas por busca estática. Comentários são ignorados — o código
# explica as próprias regras neles: linhas que começam com //, /*, * ou {/*, e
# trechos /* … */ ou // … no meio da linha. O padrão é testado de novo no que
# sobra.
# Limitação: a busca é por linha — um texto quebrado entre linhas no JSX escapa.
# Padrões: minúsculos, acentos por alternância — neste ambiente (C.UTF-8) nem
# grep -i, nem classes [oó], nem tolower do awk tratam caracteres multibyte.

# gov_check NÍVEL RÓTULO PADRÃO ALLOWLIST ORIENTAÇÃO
#   NÍVEL: BLOCKING (falha o audit) ou WARNING
#   ALLOWLIST: caminhos exatos separados por "|" onde a ocorrência é legítima
# Exceção estrutural: linhas dentro de uma constante FORBIDDEN_* = [ … ] são
# ignoradas — uma lista de bloqueio precisa conter os termos que bloqueia
# (ex.: FORBIDDEN_HOME_CLAIMS em src/lib/content/home.ts, usada pelos testes).
gov_check() {
  local level="$1" label="$2" pattern="$3" allow="$4" hint="$5"
  local hits
  hits=$(grep -rniE $EXTS $EXCLUDE "$pattern" $SEARCH_DIRS 2>/dev/null | GOV_PAT="$pattern" awk -v allow="$allow" '
    BEGIN { pat = ENVIRON["GOV_PAT"]; n = split(allow, a, "|"); for (i = 1; i <= n; i++) ok[a[i]] = 1 }
    function in_denylist(f, ln,   l, k, open) {
      if (!(f in scanned)) {
        scanned[f] = 1; k = 0; open = 0
        while ((getline l < f) > 0) {
          k++
          if (!open && l ~ /FORBIDDEN_[A-Z0-9_]*[^=]*=[ \t]*\[/) open = 1
          if (open) deny[f, k] = 1
          if (open && l ~ /\]/) open = 0
        }
        close(f)
      }
      return ((f, ln) in deny)
    }
    {
      i = index($0, ":"); file = substr($0, 1, i - 1); rest = substr($0, i + 1)
      j = index(rest, ":"); line = substr(rest, 1, j - 1); text = substr(rest, j + 1)
      if (file in ok) next
      if (in_denylist(file, line)) next
      if (text ~ /^[ \t]*(\/\/|\/\*|\*|\{\/\*)/) next
      code = text
      gsub(/\{?\/\*([^*]|\*+[^*\/])*\*+\/\}?/, "", code)
      sub(/(^|[ \t;,])\/\/.*$/, "", code)
      if (tolower(code) !~ pat) next
      sub(/^[ \t]+/, "", text)
      printf "%s:%s\n    %s\n", file, line, text
    }' || true)
  gov_report "$level" "$label" "$hits" "$hint"
}

gov_report() {
  local level="$1" label="$2" hits="$3" hint="$4"
  [ -z "$hits" ] && return 0
  if [ "$level" = "BLOCKING" ]; then
    printf '%s✗ [BLOCKING] %s%s\n' "$RED" "$label" "$OFF"; FAIL=1
  else
    printf '%s! [WARNING] %s%s\n' "$YEL" "$label" "$OFF"
  fi
  printf '%s\n→ %s\n\n' "$(echo "$hits" | head -40)" "$hint"
}

echo "── Governança ──"

# CTAs descontinuados — AGENTS.md § CTA: "proibidas como CTA vigente em qualquer
# página".
gov_check BLOCKING "CTA descontinuado" \
  'solicitar[[:space:]]+diagn(o|ó|Ó)stico|diagn(o|ó|Ó)stico[[:space:]]+gratuito' \
  "" \
  'Use "Falar sobre minha operação" ou o CTA contextual da tabela em AGENTS.md § CTA.'

# Zapbox pelo apex — AGENTS.md § Handoff: "Use sempre https://www.zapbox.cloud/,
# com www: o apex responde 308". Sem exceções.
gov_check BLOCKING "Zapbox sem www" \
  '(https?:)?//zapbox\.cloud' \
  "" \
  'Use https://www.zapbox.cloud/ — o apex zapbox.cloud responde 308.'

# Link direto ao Zapbox — CD-1 = BRIDGE_FIRST (docs/19): superfície RC2 → /zapbox
# → produto; link direto "exige decisão registrada". Exceções registradas:
#   zapboxBridge.ts  → a própria ponte, único CTA que sai do domínio (docs/19, docs/20)
#   llms.txt         → texto aprovado em docs/20 §11 ("encaminha para https://www.zapbox.cloud/")
ZAPBOX_DIRECT_ALLOW="src/lib/content/zapboxBridge.ts|src/app/llms.txt/route.ts"
gov_check BLOCKING "Link direto ao Zapbox fora da ponte" \
  'https?://(www\.)?zapbox\.cloud' \
  "$ZAPBOX_DIRECT_ALLOW" \
  'Aponte para /zapbox (CD-1 = BRIDGE_FIRST, docs/19). Link direto só com decisão registrada e entrada em ZAPBOX_DIRECT_ALLOW.'

# Barlow Condensed — AGENTS.md § Tipografia: Medium 500 no .rc2-label e
# ExtraBold 800 só no .rc2-hero-signature. Carregada em layout.tsx e exposta
# em globals.css; qualquer outro arquivo que a referencie é violação.
gov_check BLOCKING "Barlow Condensed fora dos pontos autorizados" \
  'font-barlow-condensed|font-condensed|barlow_condensed|barlow[[:space:]]+condensed' \
  "src/app/globals.css|src/app/layout.tsx" \
  'Barlow Condensed só existe via .rc2-label (500) e .rc2-hero-signature (800, h1 da Home).'

# Dentro de globals.css: a fonte só pode aparecer nos seletores autorizados
# (além da definição do token --font-condensed no @theme).
if [ -f src/app/globals.css ]; then
  hits=$(awk '
    {
      # Remove comentários /* */, inclusive os de várias linhas.
      line = $0; raw = ""
      while (length(line)) {
        if (inc) { p = index(line, "*/"); if (!p) { line = "" } else { line = substr(line, p + 2); inc = 0 } }
        else { p = index(line, "/*"); if (!p) { raw = raw line; line = "" } else { raw = raw substr(line, 1, p - 1); line = substr(line, p + 2); inc = 1 } }
      }
      if (raw ~ /\{/) { s = raw; sub(/[ \t]*\{.*/, "", s); sub(/^[ \t]+/, "", s); stack[++depth] = s }
      if (raw ~ /font-barlow-condensed|font-condensed/ && raw !~ /^[ \t]*--font-condensed:/) {
        sel = depth > 0 ? stack[depth] : "(raiz)"
        if (sel != ".rc2-label" && sel != ".rc2-hero-signature") {
          t = $0; sub(/^[ \t]+/, "", t)
          printf "src/app/globals.css:%d\n    %s   [seletor: %s]\n", NR, t, sel
        }
      }
      n = gsub(/\}/, "}", raw); while (n-- > 0 && depth > 0) depth--
    }' src/app/globals.css)
  gov_report BLOCKING "Barlow Condensed em seletor não autorizado (globals.css)" "$hits" \
    'Em globals.css, a fonte condensada só é permitida em .rc2-label e .rc2-hero-signature.'
fi

# Gesto de assinatura — AGENTS.md § Tipografia: único ponto de uso é o h1 da
# Home. Definido em globals.css, aplicado em (public)/page.tsx.
gov_check BLOCKING "rc2-hero-signature fora do h1 da Home" \
  'rc2-hero-signature' \
  "src/app/globals.css|src/app/(public)/page.tsx" \
  'A classe .rc2-hero-signature é exclusiva do h1 da Home. Use .rc2-h1 nos demais títulos.'

if [ "$FAIL" -eq 0 ]; then
  printf '%s✓ Nenhuma violação bloqueante.%s\n' "$GRN" "$OFF"
else
  printf '%s✗ Violações bloqueantes encontradas. Veja AGENTS.md.%s\n' "$RED" "$OFF"
fi
exit $FAIL
