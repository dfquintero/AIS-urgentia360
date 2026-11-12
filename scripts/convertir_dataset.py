"""Convierte la base sintética URGENTIA 360° (Excel UNAL–Kantera) al JSON compacto que carga el prototipo.

Uso:
    pip install openpyxl
    python scripts/convertir_dataset.py "ruta/al/archivo.xlsx"

Genera public/datos/urgentia360.json (excluido de git: el Excel no debe publicarse sin aprobación).
Los tiempos se expresan en minutos desde el inicio del periodo simulado (hora de Bogotá).
"""

import json
import sys
from datetime import datetime
from pathlib import Path

import openpyxl

SALIDA = Path(__file__).resolve().parent.parent / 'public' / 'datos' / 'urgentia360.json'
FORMATO = '%Y-%m-%d %H:%M:%S'
ETAPAS = ['punto0', 'triage', 'admision', 'valoracion', 'ayudas', 'revaloracion', 'conducta', 'egreso']


def hoja(libro, nombre):
    filas = [list(f) for f in libro[nombre].iter_rows(values_only=True)]
    cabecera = filas[0]
    return [dict(zip(cabecera, f)) for f in filas[1:] if any(c is not None for c in f)]


def main(ruta_excel):
    libro = openpyxl.load_workbook(ruta_excel, data_only=True)
    parametros = {p['Parámetro']: p['Valor'] for p in hoja(libro, 'PARAMETROS')}
    inicio = datetime.strptime(str(parametros['Inicio de periodo simulado']), FORMATO)
    corte = datetime.strptime(str(parametros['Marca de corte simulada']), FORMATO)

    def minutos(valor):
        if valor in (None, ''):
            return None
        return round((datetime.strptime(str(valor), FORMATO) - inicio).total_seconds() / 60)

    ordenes_por_episodio = {}
    ordenes = []
    for o in hoja(libro, 'ORDENES_DIAGNOSTICAS'):
        orden = {
            'id': o['orden_id'],
            'ep': o['episodio_id'],
            'tipo': o['tipo_orden'],
            'desc': o['descripcion_generica'],
            'sistema': o['sistema_referencial'],
            't': [minutos(o[c]) for c in ('fecha_solicitud', 'fecha_toma_o_inicio',
                                          'fecha_resultado_disponible', 'fecha_resultado_revisado')],
        }
        ordenes.append(orden)
        ordenes_por_episodio.setdefault(orden['ep'], []).append(orden)

    episodios = []
    for e in hoja(libro, 'EPISODIOS'):
        turno, t_ini, t_fin = minutos(e['fecha_turno']), minutos(e['triage_inicio']), minutos(e['triage_fin'])
        admision, valoracion = minutos(e['admision_his']), minutos(e['primera_valoracion'])
        conducta, egreso = minutos(e['definicion_conducta']), minutos(e['egreso'])
        propias = ordenes_por_episodio.get(e['episodio_id'], [])

        # Hitos secuenciales: [etapa, llegada, entrada, salida]. Los cruces de la simulación se recortan
        # para que cada etapa termine cuando comienza la siguiente.
        tramos = [['punto0', turno, turno, turno], ['triage', turno, t_ini, t_fin],
                  ['admision', t_fin, admision, admision], ['valoracion', admision, valoracion, None]]
        siguiente_fija = conducta if conducta is not None else egreso
        solicitudes = [o['t'][0] for o in propias if o['t'][0] is not None]
        if solicitudes and (siguiente_fija is None or min(solicitudes) < siguiente_fija):
            tomas = [o['t'][1] for o in propias if o['t'][1] is not None]
            disponibles = [o['t'][2] for o in propias]
            fin_ayudas = max(disponibles) if all(d is not None for d in disponibles) else None
            tramos.append(['ayudas', min(solicitudes), min(tomas) if tomas else None, fin_ayudas])
            revisiones = [o['t'][3] for o in propias if o['t'][3] is not None]
            if revisiones and (siguiente_fija is None or min(revisiones) < siguiente_fija):
                tramos.append(['revaloracion', fin_ayudas if fin_ayudas is not None else min(revisiones),
                               min(revisiones), None])
        if conducta is not None:
            tramos.append(['conducta', conducta, conducta, egreso])
        if egreso is not None:
            tramos.append(['egreso', egreso, egreso, egreso])

        for actual, siguiente in zip(tramos, tramos[1:]):
            limite = siguiente[1]
            actual[3] = limite if actual[3] is None or actual[3] > limite else actual[3]
            siguiente[1] = max(siguiente[1], actual[1])
        for tramo in tramos:
            if tramo[2] is not None and tramo[3] is not None and tramo[2] > tramo[3]:
                tramo[2] = tramo[3]

        episodios.append({
            'id': e['episodio_id'],
            'turno': e['turno_id'],
            'triage': e['categoria_triage'],
            'edad': e['grupo_edad'],
            'demanda': e['tipo_demanda_simulada'],
            'resp': e['responsable_codigo_ficticio'],
            'destino': e['destino_egreso'],
            'area': e['area_actual_simulada'],
            'h': [[ETAPAS.index(t[0]), t[1], t[2], t[3]] for t in tramos],
        })

    tablas = {'tipo': [], 'fase': [], 'sistema': [], 'rol': [], 'nota': []}

    def indice(tabla, valor):
        lista = tablas[tabla]
        if valor not in lista:
            lista.append(valor)
        return lista.index(valor)

    eventos = sorted(hoja(libro, 'EVENTOS'), key=lambda v: (v['fecha_hora_evento'], v['evento_id']))
    indice_episodio = {e['id']: i for i, e in enumerate(episodios)}
    filas_eventos = [[indice_episodio[v['episodio_id']], minutos(v['fecha_hora_evento']),
                      indice('fase', v['fase']), indice('tipo', v['tipo_evento']),
                      indice('sistema', v['sistema_referencial']), indice('rol', v['responsable_rol']),
                      indice('nota', v['nota_operativa_sintetica'])] for v in eventos]

    capacidad = [{
        't': minutos(c['fecha_hora_bloque']),
        'franja': c['franja'],
        'medicos': c['medicos_simulados'],
        'enfermeria': c['enfermeria_simulada'],
        'triage': c['puestos_triage_simulados'],
        'observacion': c['puestos_observacion_simulados'],
        'demanda': c['demanda_escenario'],
    } for c in hoja(libro, 'CAPACIDAD_SIMULADA')]

    datos = {
        'fuente': 'URGENTIA 360° · Base de datos sintética UNAL–Kantera 2026',
        'inicio': inicio.strftime('%Y-%m-%dT%H:%M:%S-05:00'),
        'corteMin': minutos(corte.strftime(FORMATO)),
        'episodios': episodios,
        'ordenes': [{**o, 'ep': indice_episodio[o['ep']]} for o in ordenes],
        'tablas': tablas,
        'eventos': filas_eventos,
        'capacidad': capacidad,
    }
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps(datos, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(episodios)} episodios, {len(filas_eventos)} eventos, {len(ordenes)} órdenes -> {SALIDA}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
