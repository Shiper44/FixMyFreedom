import { describe, expect, it } from "vitest";
import { completarIsin, esIsinValido } from "../lib/isin";

describe("ISIN", () => {
  it("acepta ISIN reales con el dígito de control correcto", () => {
    expect(esIsinValido("US0378331005")).toBe(true); // Apple
    expect(esIsinValido("IE00B4L5Y983")).toBe(true); // iShares Core MSCI World
    expect(esIsinValido("ES0113900J37")).toBe(true); // Banco Santander
  });

  it("rechaza formato o dígito de control incorrectos", () => {
    expect(esIsinValido("US0378331006")).toBe(false);
    expect(esIsinValido("us0378331005")).toBe(false);
    expect(esIsinValido("US03783310")).toBe(false);
  });

  it("completarIsin genera códigos válidos", () => {
    expect(esIsinValido(completarIsin("ZZEJ0000001"))).toBe(true);
  });
});
