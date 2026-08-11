#!/usr/bin/env bash
# Auditoria de conformidade com o Brand Guide RC2 v3.
# Falha se encontrar valores da paleta descontinuada ou hex literal em componente.
# Uso: npm run audit:brand

set -uo pipefail

DIRS="${DIRS:-app src components pages styles lib}"
EXTS="--include=*.tsx --include=*.jsx --include=*.ts --include=*.js --include=*.css --include=*.scss --include=*.html"
EXCLUDE="--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build"

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

if [ "$FAIL" -eq 0 ]; then
  printf '%s✓ Nenhuma violação bloqueante.%s\n' "$GRN" "$OFF"
else
  printf '%s✗ Violações bloqueantes encontradas. Veja AGENTS.md.%s\n' "$RED" "$OFF"
fi
exit $FAIL
