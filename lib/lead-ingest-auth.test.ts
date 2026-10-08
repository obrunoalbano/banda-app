import { describe, expect, it } from "vitest";
import { extractLeadIngestToken, generateLeadIngestToken, hashLeadIngestToken } from "./lead-ingest-auth";

const req = (headers: Record<string, string>) => new Request("http://x/api", { headers });

describe("token de ingestão", () => {
  it("lê Bearer ou X-Lead-Token", () => {
    expect(extractLeadIngestToken(req({ authorization: "Bearer abc" }))).toBe("abc");
    expect(extractLeadIngestToken(req({ "x-lead-token": " xyz " }))).toBe("xyz");
    expect(extractLeadIngestToken(req({ authorization: "Basic abc" }))).toBeNull();
    expect(extractLeadIngestToken(req({}))).toBeNull();
  });
  it("hash é SHA-256 hex e bate com o gerado", () => {
    const { token, hash } = generateLeadIngestToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashLeadIngestToken(token));
    // Mesmo valor que o Postgres calcula na migration: encode(sha256(convert_to(t,'UTF8')),'hex')
    expect(hashLeadIngestToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
