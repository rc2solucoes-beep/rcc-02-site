#!/usr/bin/env node
// Hook PostToolUse (Edit|Write): valida o arquivo alterado com
//   1. npm run audit:brand  — regras de marca (ts/tsx/css em src/, exceto pastas admin)
//   2. ESLint só no arquivo — ts/tsx em src/
// Somente leitura: não corrige, não altera arquivos, não usa --fix.
//
// Exit codes (contrato do Claude Code):
//   0 → nada a reportar
//   2 → stderr vai para o Claude (violação, lint ou erro operacional do hook)

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const TIMEOUT_MS = 45_000;
const AUDIT_FAIL_SENTINEL = "Violações bloqueantes encontradas";

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

function run(command, args, cwd, { shell = false } = {}) {
  return new Promise((resolve) => {
    let out = "";
    let err = "";
    let child;
    try {
      child = spawn(command, args, { cwd, shell, windowsHide: true });
    } catch (e) {
      resolve({ code: null, out, err: String(e) });
      return;
    }
    const timer = setTimeout(() => {
      child.kill();
      err += `\n[hook] tempo limite de ${TIMEOUT_MS / 1000}s excedido`;
    }, TIMEOUT_MS);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => (err += `\n[hook] ${e.message}`));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, out: stripAnsi(out), err: stripAnsi(err) });
    });
  });
}

async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

function operationalError(message) {
  process.stderr.write(
    `[hook post-edit-validate] ERRO OPERACIONAL DO HOOK (não é violação no código editado):\n${message}\n` +
      `Informe o usuário; não altere o código por causa deste erro.\n`,
  );
  process.exit(2);
}

let payload;
try {
  payload = JSON.parse(await readStdin());
} catch (e) {
  operationalError(`Não foi possível ler o JSON do hook: ${e.message}`);
}

const projectDir = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
const filePath = payload?.tool_input?.file_path;
if (!filePath) process.exit(0);

const abs = path.resolve(projectDir, filePath);
const rel = path.relative(projectDir, abs).split(path.sep).join("/");
const ext = path.extname(rel).toLowerCase();

// Filtro de escopo: src/**/*.{ts,tsx,css}
if (rel.startsWith("..") || !rel.startsWith("src/")) process.exit(0);
if (![".ts", ".tsx", ".css"].includes(ext)) process.exit(0);
if (!existsSync(abs)) process.exit(0);

// audit-brand.sh usa --exclude-dir=admin: uma edição ali não muda o resultado.
const runAudit = !rel.split("/").includes("admin");
// ESLint não tem configuração para CSS neste projeto.
const runLint = ext === ".ts" || ext === ".tsx";

const eslintBin = path.join(projectDir, "node_modules", "eslint", "bin", "eslint.js");

const [audit, lint] = await Promise.all([
  runAudit ? run("npm run audit:brand", [], projectDir, { shell: true }) : null,
  runLint
    ? existsSync(eslintBin)
      ? run(process.execPath, [eslintBin, "--no-warn-ignored", abs], projectDir)
      : { code: null, out: "", err: `ESLint não encontrado em ${eslintBin}` }
    : null,
]);

const sections = [];
const opErrors = [];

if (audit && audit.code !== 0) {
  if (audit.code === 1 && audit.out.includes(AUDIT_FAIL_SENTINEL)) {
    sections.push(
      `✗ BRAND AUDIT (npm run audit:brand) — violação bloqueante.\n` +
        `O audit varre todo o src/; confira se as ocorrências abaixo vêm de ${rel}.\n\n` +
        `${audit.out.trim()}${audit.err.trim() ? `\n[stderr]\n${audit.err.trim()}` : ""}`,
    );
  } else {
    opErrors.push(
      `npm run audit:brand terminou com código ${audit.code} sem o resultado esperado do audit.\n` +
        `[stdout]\n${audit.out.trim()}\n[stderr]\n${audit.err.trim()}`,
    );
  }
}

if (lint && lint.code !== 0) {
  if (lint.code === 1) {
    sections.push(
      `✗ ESLINT — erros em ${rel}.\n\n${lint.out.trim()}${lint.err.trim() ? `\n[stderr]\n${lint.err.trim()}` : ""}`,
    );
  } else {
    opErrors.push(
      `ESLint terminou com código ${lint.code} (falha de execução/configuração, não de lint).\n` +
        `[stdout]\n${lint.out.trim()}\n[stderr]\n${lint.err.trim()}`,
    );
  }
}

if (sections.length === 0 && opErrors.length === 0) process.exit(0);

let message = `[hook post-edit-validate] Arquivo que disparou a validação: ${rel}\n\n`;
if (sections.length) {
  message +=
    sections.join("\n\n---\n\n") +
    `\n\nCorrija esses problemas antes de considerar a alteração concluída.\n`;
}
if (opErrors.length) {
  message +=
    `\nERRO OPERACIONAL DO HOOK (não é violação no código editado):\n` +
    opErrors.join("\n\n") +
    `\nInforme o usuário; não altere o código por causa deste erro.\n`;
}
process.stderr.write(message);
process.exit(2);
