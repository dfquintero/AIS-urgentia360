const CODIGO = /\b(?:TURNO-FICT|DEM-URG)-\d+\b/i;

/** Extrae el código de turno o episodio del texto leído en un QR (admite texto alrededor, p. ej. una URL). */
export function codigoDesdeQr(texto: string): string {
  const limpio = texto.trim();
  return (limpio.match(CODIGO)?.[0] ?? limpio).toUpperCase();
}
