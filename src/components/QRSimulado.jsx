const N = 21

function hash(texto) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function esPatronLocalizador(x, y) {
  const enCuadro = (cx, cy) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7
  return enCuadro(0, 0) || enCuadro(N - 7, 0) || enCuadro(0, N - 7)
}

function celdaLocalizador(x, y) {
  const lx = x >= N - 7 ? x - (N - 7) : x
  const ly = y >= N - 7 ? y - (N - 7) : y
  const borde = lx === 0 || ly === 0 || lx === 6 || ly === 6
  const centro = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4
  return borde || centro
}

// Representación visual de un QR. No es un código QR legible por lectores reales.
export default function QRSimulado({ codigo, tamano = 96 }) {
  let s = hash(codigo)
  const siguiente = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
  const celdas = []
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const separador = (x === 7 && y < 8) || (y === 7 && x < 8) || (x === N - 8 && y < 8) || (y === 7 && x >= N - 8) || (x === 7 && y >= N - 8) || (y === N - 8 && x < 8)
      const activa = esPatronLocalizador(x, y) ? celdaLocalizador(x, y) : !separador && siguiente() > 0.52
      if (activa) celdas.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
    }
  }
  return (
    <svg
      viewBox={`-1 -1 ${N + 2} ${N + 2}`}
      width={tamano}
      height={tamano}
      role="img"
      aria-label={`QR simulado ${codigo}`}
      className="rounded bg-white"
      shapeRendering="crispEdges"
    >
      <g fill="#0f172a">{celdas}</g>
    </svg>
  )
}
