import { describe, expect, it } from "vitest";
import {
  canAddToVenues,
  DEAL_STEPS,
  DEAL_STEP_LABELS,
  dealFromLead,
  dealFromStage,
  venuePrefillFromLead,
  venuePrefillFromSnapshot,
  venuePrefillFromStage,
} from "./deals";

describe("etapas", () => {
  it("ordem fixa do quadro", () => {
    expect(DEAL_STEPS.map((s) => DEAL_STEP_LABELS[s])).toEqual(["Primeiro contato", "Proposta", "Perdeu", "Ganhou"]);
  });
});

describe("canAddToVenues", () => {
  it("só ganhou e ainda sem casa", () => {
    expect(canAddToVenues({ step: "GANHOU", venueId: null })).toBe(true);
    expect(canAddToVenues({ step: "GANHOU", venueId: "v1" })).toBe(false);
    for (const step of ["PRIMEIRO_CONTATO", "PROPOSTA", "PERDEU"] as const) {
      expect(canAddToVenues({ step, venueId: null })).toBe(false);
    }
  });
});

describe("origem da negociação", () => {
  it("contato", () => {
    expect(dealFromLead({ id: "l1", name: "Ana", city: "Santos" }, "b1")).toEqual({
      bandId: "b1",
      source: "CONTATO",
      leadId: "l1",
      name: "Ana",
      city: "Santos",
      state: null,
    });
  });
  it("palco", () => {
    expect(dealFromStage({ id: "s1", name: "Bar X", city: "Santos", state: "SP" }, "b1")).toEqual({
      bandId: "b1",
      source: "EXPLORADOR",
      stageId: "s1",
      name: "Bar X",
      city: "Santos",
      state: "SP",
    });
  });
});

describe("pré-preenchimento da casa", () => {
  const stage = {
    name: "Bar X",
    city: "Santos",
    state: "SP",
    instagram: "@barx",
    whatsapp: null,
    publicPhone: "(13) 3333-4444",
    publicEmail: null,
  };
  it("palco: WhatsApp ou telefone comercial; responsável vazio (LGPD)", () => {
    expect(venuePrefillFromStage(stage)).toEqual({
      name: "Bar X",
      responsible: "",
      phone: "(13) 3333-4444",
      email: "",
      city: "Santos",
      state: "SP",
      instagram: "@barx",
    });
    expect(venuePrefillFromStage({ ...stage, whatsapp: "(13) 99999-0000" }).phone).toBe("(13) 99999-0000");
  });
  it("contato: a pessoa vira o responsável", () => {
    expect(venuePrefillFromLead({ name: "Ana", email: "ana@x.com", whatsapp: null, city: null })).toEqual({
      name: "",
      responsible: "Ana",
      phone: "",
      email: "ana@x.com",
      city: "",
      state: "",
      instagram: "",
    });
  });
  it("origem apagada: usa o que foi copiado", () => {
    expect(venuePrefillFromSnapshot({ name: "Bar X", city: "Santos", state: null })).toMatchObject({
      name: "Bar X",
      city: "Santos",
      state: "",
    });
  });
});
