import { describe, expect, it } from "vitest";
import { montarTranscricao } from "@/routes/index";

describe("montarTranscricao", () => {
  it("evita duplicação cumulativa do Chrome no Android", () => {
    expect(
      montarTranscricao("", [
        "você parou",
        "você parou afastado",
        "você parou afastado do meio-fio",
      ]),
    ).toBe("Você parou afastado do meio-fio");
  });

  it("evita duplicação de trecho repetido", () => {
    expect(
      montarTranscricao("", ["parou afastado", "parou afastado", "afastado"]),
    ).toBe("Parou afastado");
  });

  it("junta trechos distintos e preserva texto anterior", () => {
    expect(
      montarTranscricao("Candidato não deu seta.", ["virou à direita", "sem olhar"]),
    ).toBe("Candidato não deu seta. virou à direita sem olhar");
  });
});