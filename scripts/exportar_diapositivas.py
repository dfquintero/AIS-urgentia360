"""Exporta las diapositivas de la presentación a imágenes WebP para el carrusel de la página de inicio.

Uso:
    python scripts/exportar_diapositivas.py [ruta.pptx] [--omitir 1,2]

Requiere LibreOffice (soffice), poppler-utils (pdftoppm) y Pillow. Para que el texto se vea igual que en
PowerPoint conviene instalar las fuentes Carlito (sustituto métrico de Calibri) y Material Icons.

Genera en public/diapositivas/:
    NN.webp          1920 × 1080, para el visor y la pantalla completa
    NN-mini.webp     384 × 216, para las miniaturas
    diapositivas.json  [{"archivo", "mini", "texto"}] (el texto de la diapositiva sirve como texto alternativo)
"""

import json
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from html import unescape
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ENTRADA = RAIZ / 'presentacion' / 'keralty_presentacion.pptx'
SALIDA = RAIZ / 'public' / 'diapositivas'
ANCHO, ANCHO_MINI = 1920, 384


def textos(pptx: Path) -> list[str]:
    with zipfile.ZipFile(pptx) as z:
        nombres = sorted(
            (n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)),
            key=lambda n: int(re.search(r'(\d+)', n).group(1)),
        )
        resultado = []
        for n in nombres:
            # Los saltos de línea dentro de un párrafo separan elementos («Ayudas<br/>diagnósticas», listas).
            xml = re.sub(r'<a:br\s*/>', '<a:t> </a:t>', z.read(n).decode('utf8'))
            parrafos = (''.join(re.findall(r'<a:t>(.*?)</a:t>', p)) for p in re.findall(r'<a:p>(.*?)</a:p>', xml, re.S))
            limpios = (unescape(p).strip() for p in parrafos)
            # Se descartan los nombres de iconos (ligaduras de Material Icons como «schedule» o «error_outline»).
            resultado.append(' · '.join(p for p in limpios if p and not re.fullmatch(r'[a-z_]+', p)))
        return resultado


def main() -> None:
    args = sys.argv[1:]
    omitir: set[int] = set()
    if '--omitir' in args:
        i = args.index('--omitir')
        omitir = {int(x) for x in args[i + 1].split(',') if x}
        del args[i : i + 2]
    pptx = Path(args[0]) if args else ENTRADA

    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', tmp, str(pptx)], check=True, capture_output=True)
        pdf = Path(tmp) / f'{pptx.stem}.pdf'
        subprocess.run(['pdftoppm', '-png', '-scale-to-x', str(ANCHO), '-scale-to-y', '-1', str(pdf), f'{tmp}/s'], check=True)
        pngs = sorted(Path(tmp).glob('s-*.png'), key=lambda p: int(p.stem.split('-')[1]))

        if SALIDA.exists():
            shutil.rmtree(SALIDA)
        SALIDA.mkdir(parents=True)
        indice = []
        for numero, (png, texto) in enumerate(zip(pngs, textos(pptx)), start=1):
            if numero in omitir:
                continue
            nombre = f'{len(indice) + 1:02d}'
            imagen = Image.open(png).convert('RGB')
            imagen.save(SALIDA / f'{nombre}.webp', 'WEBP', quality=82, method=6)
            mini = imagen.resize((ANCHO_MINI, round(imagen.height * ANCHO_MINI / imagen.width)), Image.LANCZOS)
            mini.save(SALIDA / f'{nombre}-mini.webp', 'WEBP', quality=75, method=6)
            indice.append({'archivo': f'{nombre}.webp', 'mini': f'{nombre}-mini.webp', 'texto': texto})

    (SALIDA / 'diapositivas.json').write_text(json.dumps(indice, ensure_ascii=False, indent=1), encoding='utf8')
    print(f'{len(indice)} diapositivas en {SALIDA.relative_to(RAIZ)}')


if __name__ == '__main__':
    main()
