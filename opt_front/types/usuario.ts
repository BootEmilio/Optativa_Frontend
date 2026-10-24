export type RolClave =
  | 'reportante'
  | 'tecnico_soporte'
  | 'coordinador_soporte'
  | 'directivo_analista'
  | 'administrador_sistema';

export type PermisoCoordinador =
  | 'incidencias:ver_area'
  | 'incidencias:asignar_tecnico'
  | 'incidencias:reasignar_tecnico'
  | 'incidencias:establecer_prioridad'
  | 'incidencias:supervisar_avances'
  | 'incidencias:auditar_resueltas'
  | 'incidencias:cerrar'
  | 'incidencias:reabrir'
  | 'etiquetas:gestionar';

export interface Rol {
  _id: string;
  clave: RolClave;
  nombre: string;
  descripcion: string;
  permisos: string[];
  activo: boolean;
  fecha_creacion: string;
}

export interface Usuario {
  _id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: RolClave;
  tipo_reportante?: 'docente' | 'estudiante' | 'administrativo';
  activo: boolean;
  fecha_creacion: string;
  telefono?: string;
  area?: string;
  avatar_url?: string;
}

export interface TecnicoDisponible {
  _id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  especialidad: string;
  activo: boolean;
  incidencias_activas: number;
  telefono?: string;
}
