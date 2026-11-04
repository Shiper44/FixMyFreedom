// Validación de códigos ISIN (ISO 6166): 2 letras de país, 9 caracteres
// alfanuméricos y un dígito de control calculado con el algoritmo de Luhn.

const FORMATO = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

function digitos(base: string): string {
  return base
    .split("")
    .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c))
    .join("");
}

export function digitoControl(base11: string): number {
  const d = digitos(base11);
  let suma = 0;
  // Desde la derecha, se duplican los dígitos en posición impar (1, 3, 5...).
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    suma += n;
  }
  return (10 - (suma % 10)) % 10;
}

export function esIsinValido(isin: string): boolean {
  if (!FORMATO.test(isin)) return false;
  return digitoControl(isin.slice(0, 11)) === Number(isin[11]);
}

export function completarIsin(base11: string): string {
  return base11 + String(digitoControl(base11));
}
