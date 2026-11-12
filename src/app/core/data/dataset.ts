import {
  BloqueCapacidad,
  Dataset,
  DestinoEgreso,
  Episodio,
  EtapaId,
  EventoEpisodio,
  NivelTriageId,
  OrdenDiagnostica,
  RegistroEtapa,
} from '../models/urgencias.models';
import { DESTINOS_EGRESO, ETAPAS, ETAPA_POR_ID, GRUPOS_EDAD, PERSONAL, ROL_EVENTO, TIPOS_DEMANDA } from './catalogos';
import { vistaEnTiempo } from '../domain/indicadores';

const MIN = 60_000;
const IDS_ETAPA = ETAPAS.map((e) => e.id);

/** Formato compacto generado por scripts/convertir_dataset.py a partir del Excel UNAL–Kantera. */
export interface DatasetCrudo {
  fuente: string;
  sede?: string;
  inicio: string;
  corteMin: number;
  episodios: {
    id: string;
    turno: string;
    triage: NivelTriageId;
    edad: string;
    demanda: string;
    resp: string;
    destino: DestinoEgreso | null;
    h: [number, number, number | null, number | null][];
  }[];
  ordenes: { id: string; ep: number; tipo: string; desc: string; sistema: string; t: (number | null)[] }[];
  tablas: Record<'tipo' | 'fase' | 'sistema' | 'rol' | 'nota', string[]>;
  eventos: [number, number, number, number, number, number, number][];
  capacidad: { t: number; franja: string; medicos: number; enfermeria: number; triage: number; observacion: number; demanda: string }[];
}

// La base solo trae el código del médico; las demás etapas se atribuyen al rol genérico.
function responsableHistorico(etapa: EtapaId, medico: string): string {
  if (etapa === 'valoracion' || etapa === 'revaloracion' || etapa === 'conducta') return medico;
  if (etapa === 'punto0') return 'Sofía / Digiturno';
  return ROL_EVENTO[ETAPA_POR_ID[etapa].rol];
}

export function parsearDataset(c: DatasetCrudo): Dataset {
  const inicio = Date.parse(c.inicio);
  const ms = (m: number | null) => (m == null ? null : inicio + m * MIN);

  const episodios: Episodio[] = c.episodios.map((e) => {
    const historial: RegistroEtapa[] = e.h.map(([i, llegada, entrada, salida]) => {
      const etapa = IDS_ETAPA[i];
      // Los cruces de hitos de la simulación no deben producir esperas negativas.
      const entradaAjustada = entrada == null ? null : Math.max(entrada, llegada);
      return {
        etapa,
        llegada: ms(llegada)!,
        entrada: ms(entradaAjustada),
        salida: ms(salida == null || entradaAjustada == null ? salida : Math.max(salida, entradaAjustada)),
        responsable: entradaAjustada != null ? responsableHistorico(etapa, e.resp) : null,
      };
    });
    const egreso = historial.find((r) => r.etapa === 'egreso')?.llegada;
    return {
      id: e.id,
      turno: e.turno,
      triage: e.triage,
      grupoEdad: e.edad,
      demanda: e.demanda,
      responsable: e.resp,
      historial,
      destino: e.destino,
      egreso,
    };
  });

  return {
    fuente: c.fuente,
    sede: c.sede ?? 'SEDE-DEMO-01',
    esRespaldo: false,
    inicio,
    corte: inicio + c.corteMin * MIN,
    episodios,
    ordenes: c.ordenes.map((o) => ({
      id: o.id,
      episodioId: c.episodios[o.ep].id,
      tipo: o.tipo,
      descripcion: o.desc,
      sistema: o.sistema,
      solicitud: ms(o.t[0])!,
      toma: ms(o.t[1]),
      disponible: ms(o.t[2]),
      revisado: ms(o.t[3]),
    })),
    eventos: c.eventos.map(([ep, t, fase, tipo, sistema, rol, nota], i) => ({
      id: `EV-${String(i + 1).padStart(6, '0')}`,
      episodioId: c.episodios[ep].id,
      ts: ms(t)!,
      fase: c.tablas.fase[fase],
      tipo: c.tablas.tipo[tipo],
      sistema: c.tablas.sistema[sistema],
      rol: c.tablas.rol[rol],
      nota: c.tablas.nota[nota],
      origen: 'Simulación',
    })),
    capacidad: c.capacidad.map((b) => ({
      inicio: ms(b.t)!,
      franja: b.franja,
      medicos: b.medicos,
      enfermeria: b.enfermeria,
      puestosTriage: b.triage,
      puestosObservacion: b.observacion,
      demanda: b.demanda,
    })),
  };
}

export type Aleatorio = () => number;

/** Generador pseudoaleatorio determinista (mulberry32). */
export function crearAleatorio(semilla = 360): Aleatorio {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const elegir = <T>(lista: readonly T[], rand: Aleatorio = Math.random): T => lista[Math.floor(rand() * lista.length)];

const entre = (rand: Aleatorio, min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

const FASE_EVENTO: Record<EtapaId, string> = {
  punto0: 'Ingreso',
  triage: 'Triage',
  admision: 'Admisión',
  valoracion: 'Valoración',
  ayudas: 'Ayudas diagnósticas',
  revaloracion: 'Revaloración',
  conducta: 'Definición',
  egreso: 'Egreso',
};

export const faseEvento = (etapa: EtapaId): string => FASE_EVENTO[etapa];

/** Reconstruye los eventos trazables de un episodio a partir de sus hitos y órdenes. */
export function eventosDesdeHitos(e: Episodio, ordenes: readonly OrdenDiagnostica[], prefijo: string): EventoEpisodio[] {
  const ev: Omit<EventoEpisodio, 'id'>[] = [];
  const agregar = (ts: number | null | undefined, etapa: EtapaId, tipo: string, sistema: string, rol: string, nota: string) => {
    if (ts != null) ev.push({ episodioId: e.id, ts, fase: FASE_EVENTO[etapa], tipo, sistema, rol, nota, origen: 'Simulación' });
  };
  const r = (etapa: EtapaId) => e.historial.find((x) => x.etapa === etapa);
  agregar(e.historial[0]?.llegada, 'punto0', 'Turno generado', 'Sofía / Digiturno (referencial)', 'Administrativo', 'Punto cero del episodio');
  agregar(r('triage')?.entrada, 'triage', 'Triage iniciado', 'HIS/Athenea (referencial)', 'Enfermería', 'Clasificación clínica simulada');
  agregar(r('triage')?.salida, 'triage', 'Triage finalizado', 'HIS/Athenea (referencial)', 'Enfermería', `Categoría ficticia: ${e.triage}`);
  agregar(r('admision')?.entrada, 'admision', 'Registro administrativo', 'HIS/Athenea (referencial)', 'Administrativo', 'Marca operativa simulada');
  agregar(r('valoracion')?.entrada, 'valoracion', 'Primera valoración', 'HIS/Athenea (referencial)', 'Médico', 'Inicio de atención médica simulado');
  for (const o of ordenes) {
    agregar(o.solicitud, 'ayudas', 'Orden solicitada', o.sistema, 'Médico', o.descripcion);
    agregar(o.toma, 'ayudas', 'Muestra o estudio iniciado', o.sistema, 'Personal diagnóstico', o.descripcion);
    agregar(o.disponible, 'ayudas', 'Resultado disponible', o.sistema, 'Personal diagnóstico', o.descripcion);
    agregar(o.revisado, 'revaloracion', 'Resultado revisado', 'HIS (referencial)', 'Médico', 'Revisión simulada de orden');
  }
  agregar(r('conducta')?.entrada, 'conducta', 'Conducta definida', 'HIS/Athenea (referencial)', 'Médico', 'Decisión clínica simulada; no sugiere conducta real');
  agregar(e.egreso, 'egreso', 'Egreso registrado', 'HIS / censo (referencial)', 'Administrativo', 'Fin del episodio');
  return ev.sort((a, b) => a.ts - b.ts).map((x, i) => ({ ...x, id: `${prefijo}-${i + 1}` }));
}

const PESOS_TRIAGE: [NivelTriageId, number][] = [['I', 0.05], ['II', 0.13], ['III', 0.52], ['IV', 0.24], ['V', 0.06]];

function triageAleatorio(rand: Aleatorio): NivelTriageId {
  let x = rand();
  for (const [nivel, peso] of PESOS_TRIAGE) if ((x -= peso) <= 0) return nivel;
  return 'III';
}

/**
 * Datos de respaldo con la misma estructura de la base UNAL–Kantera, generados en el navegador
 * cuando no existe public/datos/urgentia360.json (el Excel no se publica en el repositorio).
 */
export function generarDatasetRespaldo(semilla = 360, total = 360): Dataset {
  const rand = crearAleatorio(semilla);
  const inicio = Date.parse('2026-10-01T00:00:00-05:00');
  const corte = inicio + 14 * 24 * 60 * MIN;
  const m = (min: number) => inicio + min * MIN;
  const periodo = 14 * 24 * 60;

  const episodios: Episodio[] = [];
  const ordenes: OrdenDiagnostica[] = [];
  let numeroOrden = 1;

  for (let i = 0; i < total; i++) {
    const triage = triageAleatorio(rand);
    const medico = elegir(PERSONAL.medico, rand);
    const turno = Math.min(periodo - 30, Math.floor((i / total) * periodo) + entre(rand, 0, 50));
    const tIni = turno + entre(rand, 2, 35);
    const tFin = tIni + entre(rand, 2, 8);
    // Triage I: atención inmediata; admisión y valoración coinciden con el fin del triage.
    const adm = triage === 'I' ? tFin : tFin + entre(rand, 3, 15);
    const val = triage === 'I' ? tFin : adm + entre(rand, 10, triage === 'II' ? 45 : 160);
    const historial: RegistroEtapa[] = [
      { etapa: 'punto0', llegada: m(turno), entrada: m(turno), salida: m(turno), responsable: 'Sofía / Digiturno' },
      { etapa: 'triage', llegada: m(turno), entrada: m(tIni), salida: m(tFin), responsable: 'Enfermería' },
      { etapa: 'admision', llegada: m(tFin), entrada: m(Math.max(adm, tFin)), salida: m(Math.max(adm, tFin)), responsable: 'Administrativo' },
    ];
    const id = `DEM-URG-${String(i + 1).padStart(5, '0')}`;
    let fin = val + entre(rand, 20, 70);
    const propias: OrdenDiagnostica[] = [];
    if (rand() < 0.7) {
      for (let k = entre(rand, 1, 3); k > 0; k--) {
        const imagen = rand() < 0.22;
        const sol = val + entre(rand, 5, 25);
        const toma = sol + entre(rand, 5, 35);
        const disp = toma + entre(rand, 30, 120);
        propias.push({
          id: `ORD-RESP-${String(numeroOrden++).padStart(6, '0')}`,
          episodioId: id,
          tipo: imagen ? 'Imagen' : 'Laboratorio',
          descripcion: elegir(imagen ? ['Tomografía genérica', 'Radiografía genérica'] : ['Hematología genérica', 'Bioquímica genérica'], rand),
          sistema: imagen ? 'PACS/RIS (referencial)' : 'LIS (referencial)',
          solicitud: m(sol),
          toma: m(toma),
          disponible: m(disp),
          revisado: m(disp + entre(rand, 5, 60)),
        });
      }
      const primeraSol = Math.min(...propias.map((o) => (o.solicitud - inicio) / MIN));
      const ultimoDisp = Math.max(...propias.map((o) => (o.disponible! - inicio) / MIN));
      const primeraRev = Math.min(...propias.map((o) => (o.revisado! - inicio) / MIN));
      fin = Math.max(...propias.map((o) => (o.revisado! - inicio) / MIN)) + entre(rand, 5, 30);
      historial.push(
        { etapa: 'valoracion', llegada: m(adm), entrada: m(val), salida: m(primeraSol), responsable: medico },
        { etapa: 'ayudas', llegada: m(primeraSol), entrada: m(primeraSol + 5), salida: m(ultimoDisp), responsable: 'Personal diagnóstico' },
        { etapa: 'revaloracion', llegada: m(ultimoDisp), entrada: m(Math.max(primeraRev, ultimoDisp)), salida: m(fin), responsable: medico },
      );
    } else {
      historial.push({ etapa: 'valoracion', llegada: m(adm), entrada: m(val), salida: m(fin), responsable: medico });
    }
    const egreso = fin + entre(rand, 10, 60);
    historial.push(
      { etapa: 'conducta', llegada: m(fin), entrada: m(fin), salida: m(egreso), responsable: medico },
      { etapa: 'egreso', llegada: m(egreso), entrada: m(egreso), salida: m(egreso), responsable: 'Administrativo' },
    );
    const completo: Episodio = {
      id,
      turno: `TURNO-FICT-${String(i + 1).padStart(5, '0')}`,
      triage,
      grupoEdad: elegir(GRUPOS_EDAD, rand),
      demanda: elegir(TIPOS_DEMANDA, rand),
      responsable: medico,
      historial,
      destino: elegir(DESTINOS_EGRESO, rand),
      egreso: m(egreso),
    };
    // Recorta al corte de la simulación para dejar episodios abiertos, como en la base original.
    const alCorte = vistaEnTiempo(completo, corte)!;
    episodios.push({ ...alCorte, triage: completo.triage, egreso: alCorte.egreso, destino: alCorte.destino });
    ordenes.push(
      ...propias.map((o) => {
        const dentro = (t: number | null) => (t != null && t <= corte ? t : null);
        return { ...o, toma: dentro(o.toma), disponible: dentro(o.disponible), revisado: dentro(o.revisado) };
      }).filter((o) => o.solicitud <= corte),
    );
  }

  const eventos = episodios
    .flatMap((e) => eventosDesdeHitos(e, ordenes.filter((o) => o.episodioId === e.id), `EV-R-${e.id.slice(-5)}`))
    .sort((a, b) => a.ts - b.ts);

  const capacidad: BloqueCapacidad[] = Array.from({ length: 84 }, (_, b) => {
    const hora = (b % 6) * 4;
    const pico = hora >= 8 && hora < 20;
    return {
      inicio: m(b * 240),
      franja: pico ? 'Pico simulado' : 'Valle simulado',
      medicos: pico ? entre(rand, 6, 8) : entre(rand, 2, 3),
      enfermeria: pico ? entre(rand, 10, 12) : entre(rand, 4, 5),
      puestosTriage: pico ? 2 : 1,
      puestosObservacion: entre(rand, 15, 22),
      demanda: pico ? elegir(['Media', 'Alta'], rand) : 'Baja',
    };
  });

  return {
    fuente: 'Datos de respaldo generados en el navegador (estructura de la base UNAL–Kantera)',
    sede: 'SEDE-DEMO-01',
    esRespaldo: true,
    inicio,
    corte,
    episodios,
    ordenes,
    eventos,
    capacidad,
  };
}
