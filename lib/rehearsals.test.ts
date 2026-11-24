import { describe, expect, it } from "vitest";
import {
  attendanceCounts,
  isOccurrence,
  isRepertoireOrder,
  orderRehearsalSongs,
  pastOccurrences,
  songCheckCounts,
  nextOccurrence,
  recurrenceDescription,
  rehearsalInviteEmail,
  upcomingOccurrences,
  type RecurrenceRule,
} from "./rehearsals";

const d = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
const ymd = (date: Date | null) => date?.toISOString().slice(0, 10) ?? null;
const rule = (date: string, recurrence: RecurrenceRule["recurrence"], until?: string): RecurrenceRule => ({
  date: d(date),
  recurrence,
  recurrenceUntil: until ? d(until) : null,
});

describe("nextOccurrence", () => {
  it("ensaio único: a própria data, ou null se já passou", () => {
    expect(ymd(nextOccurrence(rule("2026-12-01", "NONE"), d("2026-11-24")))).toBe("2026-12-01");
    expect(ymd(nextOccurrence(rule("2026-12-01", "NONE"), d("2026-12-01")))).toBe("2026-12-01");
    expect(nextOccurrence(rule("2026-11-01", "NONE"), d("2026-11-24"))).toBeNull();
  });
  it("semanal e quinzenal: mesmo dia da semana", () => {
    // 2026-11-03 é terça
    expect(ymd(nextOccurrence(rule("2026-11-03", "WEEKLY"), d("2026-11-24")))).toBe("2026-11-24");
    expect(ymd(nextOccurrence(rule("2026-11-03", "WEEKLY"), d("2026-11-25")))).toBe("2026-12-01");
    expect(ymd(nextOccurrence(rule("2026-11-03", "BIWEEKLY"), d("2026-11-24")))).toBe("2026-12-01");
    expect(ymd(nextOccurrence(rule("2026-11-03", "BIWEEKLY"), d("2026-11-17")))).toBe("2026-11-17");
  });
  it("futuro: primeira ocorrência é a data de início", () => {
    expect(ymd(nextOccurrence(rule("2027-01-05", "WEEKLY"), d("2026-11-24")))).toBe("2027-01-05");
  });
  it("mensal: mesmo dia do mês; dia 31 vira o último dia do mês curto", () => {
    expect(ymd(nextOccurrence(rule("2026-01-12", "MONTHLY"), d("2026-11-24")))).toBe("2026-12-12");
    expect(ymd(nextOccurrence(rule("2026-01-12", "MONTHLY"), d("2026-11-12")))).toBe("2026-11-12");
    expect(ymd(nextOccurrence(rule("2026-01-31", "MONTHLY"), d("2027-02-01")))).toBe("2027-02-28");
    expect(ymd(nextOccurrence(rule("2026-10-31", "MONTHLY"), d("2026-12-31")))).toBe("2026-12-31");
  });
  it("recorrência encerrada", () => {
    expect(nextOccurrence(rule("2026-11-03", "WEEKLY", "2026-11-20"), d("2026-11-24"))).toBeNull();
    expect(ymd(nextOccurrence(rule("2026-11-03", "WEEKLY", "2026-11-24"), d("2026-11-24")))).toBe("2026-11-24");
  });
});

describe("isOccurrence", () => {
  it("confere datas válidas da série", () => {
    const r = rule("2026-11-03", "WEEKLY", "2026-12-31");
    expect(isOccurrence(r, d("2026-11-10"))).toBe(true);
    expect(isOccurrence(r, d("2026-11-11"))).toBe(false);
    expect(isOccurrence(r, d("2026-10-27"))).toBe(false);
    expect(isOccurrence(r, d("2027-01-05"))).toBe(false);
    expect(isOccurrence(rule("2026-12-01", "NONE"), d("2026-12-01"))).toBe(true);
    expect(isOccurrence(rule("2026-12-01", "NONE"), d("2026-12-08"))).toBe(false);
  });
});

describe("upcomingOccurrences", () => {
  it("lista as próximas datas", () => {
    expect(upcomingOccurrences(rule("2026-11-03", "BIWEEKLY"), d("2026-11-24"), 3).map(ymd)).toEqual([
      "2026-12-01",
      "2026-12-15",
      "2026-12-29",
    ]);
    expect(upcomingOccurrences(rule("2026-12-01", "NONE"), d("2026-11-24"), 3).map(ymd)).toEqual(["2026-12-01"]);
  });
});

describe("recurrenceDescription", () => {
  it("texto em pt-BR com o dia", () => {
    expect(recurrenceDescription("WEEKLY", d("2026-11-03"))).toBe("Toda terça-feira");
    expect(recurrenceDescription("WEEKLY", d("2026-11-07"))).toBe("Todo sábado");
    expect(recurrenceDescription("BIWEEKLY", d("2026-11-06"))).toBe("A cada 2 semanas, às sextas-feiras");
    expect(recurrenceDescription("MONTHLY", d("2026-11-12"))).toBe("Todo mês, no dia 12");
    expect(recurrenceDescription("NONE", d("2026-11-12"))).toBe("Não se repete");
  });
});

describe("attendanceCounts", () => {
  it("sem resposta conta como pendente", () => {
    expect(
      attendanceCounts(
        ["a", "b", "c"],
        [
          { memberId: "a", status: "CONFIRMED" },
          { memberId: "x", status: "DECLINED" },
        ],
      ),
    ).toEqual({ CONFIRMED: 1, DECLINED: 0, PENDING: 2 });
  });
});

describe("email do ensaio", () => {
  it("escapa o HTML e leva o link", () => {
    const email = rehearsalInviteEmail({
      bandName: "<Os Ruídos>",
      rehearsalName: "Ensaio geral",
      when: "terça-feira, 01/12/2026 às 19:30",
      location: "Estúdio X",
      recurrence: "Toda terça-feira",
      url: "https://app/ensaios/1",
    });
    expect(email.html).toContain("&#60;Os Ruídos&#62;");
    expect(email.text).toContain("https://app/ensaios/1");
    expect(email.text).toContain("(toda terça-feira)");
  });
});

describe("pastOccurrences", () => {
  it("semanal: as mais recentes primeiro, até hoje inclusive", () => {
    expect(pastOccurrences(rule("2026-11-03", "WEEKLY"), d("2026-11-24"), 3).map(ymd)).toEqual([
      "2026-11-24",
      "2026-11-17",
      "2026-11-10",
    ]);
  });
  it("respeita o fim da recorrência", () => {
    expect(pastOccurrences(rule("2026-11-03", "WEEKLY", "2026-11-12"), d("2026-11-24"), 5).map(ymd)).toEqual([
      "2026-11-10",
      "2026-11-03",
    ]);
  });
  it("único: só se já aconteceu", () => {
    expect(pastOccurrences(rule("2026-11-20", "NONE"), d("2026-11-24"), 5).map(ymd)).toEqual(["2026-11-20"]);
    expect(pastOccurrences(rule("2026-12-01", "NONE"), d("2026-11-24"), 5)).toEqual([]);
  });
  it("primeira data ainda no futuro → nenhuma", () => {
    expect(pastOccurrences(rule("2026-12-01", "WEEKLY"), d("2026-11-24"), 5)).toEqual([]);
  });
});

describe("músicas do ensaio", () => {
  const songs = ["a", "b", "c", "d"].map((id) => ({ id }));
  const ids = (list: { id: string }[]) => list.map((s) => s.id);

  it("sem ordem salva = ordem do repertório", () => {
    expect(ids(orderRehearsalSongs(songs, []))).toEqual(["a", "b", "c", "d"]);
  });
  it("aplica a ordem do ensaio; novas no fim; ids removidos ignorados", () => {
    expect(ids(orderRehearsalSongs(songs, ["c", "x", "a"]))).toEqual(["c", "a", "b", "d"]);
  });
  it("detecta a ordem do repertório", () => {
    expect(isRepertoireOrder(["a", "b"], ["a", "b"])).toBe(true);
    expect(isRepertoireOrder(["b", "a"], ["a", "b"])).toBe(false);
  });
  it("conta ensaiadas, que faltaram e sem marcação", () => {
    expect(
      songCheckCounts(
        ["a", "b", "c"],
        [
          { songId: "a", status: "REHEARSED" },
          { songId: "b", status: "MISSED" },
          { songId: "z", status: "REHEARSED" },
        ],
      ),
    ).toEqual({ REHEARSED: 1, MISSED: 1, NONE: 1 });
  });
});
