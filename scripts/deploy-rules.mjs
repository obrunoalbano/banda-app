/**
 * Regras puras do processo de deploy (usadas por scripts/deploy-check.mjs; teste em tests/deploy-rules.test.ts).
 */

/**
 * Comandos de migration que NÃO são retrocompatíveis: a migration roda antes do merge, então durante
 * alguns minutos o código antigo convive com o banco novo. Remover/renomear/endurecer coluna quebra o
 * código antigo — faça em duas etapas (expandir agora, contrair num deploy seguinte).
 */
const RISKY = [
  [/\bDROP\s+(TABLE|COLUMN|TYPE|INDEX|CONSTRAINT)\b/i, "remove estrutura"],
  [/\bRENAME\s+(COLUMN|TO|VALUE)\b/i, "renomeia"],
  [/\bALTER\s+COLUMN\s+\S+\s+SET\s+NOT\s+NULL\b/i, "torna coluna obrigatória"],
  [/\bALTER\s+COLUMN\s+\S+\s+(SET\s+DATA\s+)?TYPE\b/i, "muda o tipo da coluna"],
  [/\bADD\s+COLUMN\b[^;]*\bNOT\s+NULL\b(?![^;]*\bDEFAULT\b)/i, "coluna obrigatória sem DEFAULT"],
  [/\b(DELETE\s+FROM|TRUNCATE)\b/i, "apaga dados"],
];

/** Trechos arriscados de um migration.sql (comentários `--` ignorados). */
export function riskyStatements(sql) {
  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const found = [];
  for (const statement of statements) {
    for (const [pattern, reason] of RISKY) {
      if (pattern.test(statement)) {
        found.push({ reason, statement: statement.length > 140 ? `${statement.slice(0, 140)}…` : statement });
        break;
      }
    }
  }
  return found;
}

/** Nomes de variáveis citados num .env.example (ativas ou comentadas: `X=` ou `# X=`). */
export function envKeys(text) {
  const keys = new Set();
  for (const line of text.split("\n")) {
    const m = /^\s*#?\s*([A-Z][A-Z0-9_]*)=/.exec(line);
    if (m) keys.add(m[1]);
  }
  return [...keys];
}

/** Migrations da branch ainda não aplicadas (e aplicadas que não existem no código = drift). */
export function migrationPlan(local, applied) {
  const appliedSet = new Set(applied);
  const localSet = new Set(local);
  return {
    pending: local.filter((m) => !appliedSet.has(m)).sort(),
    unknown: applied.filter((m) => !localSet.has(m)).sort(),
  };
}
