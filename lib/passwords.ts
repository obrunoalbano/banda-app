import { randomInt } from "node:crypto";
import { hash } from "bcryptjs";

/** Custo do bcrypt (mesmo do cadastro). */
const BCRYPT_COST = 12;

/** Sem caracteres ambíguos (0/O, 1/l/I): a senha provisória é repassada a outra pessoa. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Senha provisória legível: "xxxx-xxxx-xxxx" (12 caracteres aleatórios, ~68 bits). */
export function generateTempPassword(): string {
  const chars = Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8).join("")}`;
}

export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}
