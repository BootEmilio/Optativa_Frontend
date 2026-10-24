export type EstadoIncidencia =
  | 'abierta'
  | 'en_proceso'
  | 'resuelta'
  | 'cerrada'
  | 'reabierta';

export type PrioridadIncidencia =
  | 'baja'
  | 'media'
  | 'alta'
  | 'critica';

// Exactamente las 3 categorías oficiales del campus
export type CategoriaIncidencia =
  | 'computo_redes'
  | 'infraestructura'
  | 'academico';

// Exactamente los 3 tipos de reportantes oficiales
export type TipoReportante =
  | 'docente'
  | 'estudiante'
  | 'administrativo';

export type AccionHistorial =
  | 'creacion'
  | 'asignacion'
  | 'reasignacion'
  | 'comentario'
  | 'resolucion'
  | 'cierre'
  | 'reapertura'
  | 'cambio_prioridad'
  | 'cambio_tags';

export interface HistorialSeguimiento {
  fecha: string;
  usuario_id?: string;
  autor: string;
  accion: AccionHistorial;
  estado_nuevo?: EstadoIncidencia | string;
  comentario: string;
  horas?: number;
}

export interface EvidenciaAdjunta {
  nombre_archivo: string;
  tipo_mime: string;
  peso_kb: number;
  url_storage: string;
  fecha_carga: string;
}

export interface ReportanteInfo {
  usuario_id: string;
  nombre: string;
  tipo: TipoReportante;
}

export interface TecnicoAsignadoInfo {
  usuario_id: string;
  nombre: string;
  correo?: string;
}

export interface UbicacionIncidencia {
  edificio: string;
  piso?: string;
  aula?: string;
  referencia?: string;
}

export interface Incidencia {
  _id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidencia;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  reportante: ReportanteInfo;
  tecnico_asignado?: TecnicoAsignadoInfo | null;
  ubicacion: UbicacionIncidencia;
  detalle_especifico?: Record<string, unknown>;
  tags: string[];
  historial_seguimiento: HistorialSeguimiento[];
  evidencias_adjuntas?: EvidenciaAdjunta[];
  horas_invertidas?: number;
  fecha_creacion: string;
  fecha_resolucion?: string;
  fecha_cierre?: string;
}

export interface FiltrosIncidencias {
  estado?: EstadoIncidencia | 'todos';
  prioridad?: PrioridadIncidencia | 'todas';
  categoria?: CategoriaIncidencia | 'todas';
  busqueda?: string;
}
