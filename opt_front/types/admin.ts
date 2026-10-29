import { RolClave, Usuario } from './usuario';
import {
  CategoriaIncidencia,
  UbicacionIncidencia,
  EvidenciaAdjunta,
} from './incidencia';

export interface AdminMetricas {
  totalIncidencias: number;
  pendientesAsignar: number;
  enProceso: number;
  resueltasAuditar: number;
  cerradas: number;
  criticas: number;
  totalUsuarios: number;
  tecnicosActivos: number;
  tiempoPromedioResolucionHoras: number;
  tasaResolucionPorcentaje: number;
}

export interface UsuarioFiltros {
  busqueda?: string;
  rol?: RolClave | 'todos';
  activo?: boolean | 'todos';
}

export interface CrearUsuarioPayload {
  nombre: string;
  apellidos: string;
  correo: string;
  rol: RolClave;
  area: string;
  telefono?: string;
  tipo_reportante?: 'docente' | 'estudiante' | 'administrativo';
}

export interface ActualizarUsuarioPayload {
  nombre?: string;
  apellidos?: string;
  correo?: string;
  rol?: RolClave;
  area?: string;
  telefono?: string;
  activo?: boolean;
  tipo_reportante?: 'docente' | 'estudiante' | 'administrativo';
}

export interface LogAuditoria {
  _id: string;
  fecha: string;
  usuario_id: string;
  usuario_nombre: string;
  modulo: 'incidencias' | 'usuarios' | 'sistema' | 'seguridad';
  accion: string;
  detalles: string;
  ip?: string;
}

/**
 * Payload para crear incidencia desde el módulo Administrador.
 * Campos requeridos por el schema Mongoose del backend:
 *   titulo, descripcion, categoria, ubicacion.edificio
 * El backend asigna automáticamente: reportante (JWT), prioridad, estado, codigo.
 * evidencias_adjuntas se gestiona mediante un endpoint dedicado de carga.
 */
export interface NuevaIncidenciaAdminPayload {
  // Requeridos por el schema backend
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidencia;
  // Ubicación: se puede pasar como objeto estructurado o como campos planos (uso interno)
  ubicacion: UbicacionIncidencia;
  // Campos planos de ubicación — alternativa al objeto (para compatibilidad interna)
  edificio?: string;
  piso?: string;
  aula?: string;
  referencia?: string;
  // Opcionales
  detalle_especifico?: Record<string, unknown>;
  tags?: string[];
  // evidencias_adjuntas omitido: endpoint dedicado de carga de archivos
}

export interface CatalogoConfiguracion {
  version: string;
  entorno: 'produccion' | 'desarrollo' | 'simulado';
  apiUrl: string;
  modoMocks: boolean;
  categoriasOficiales: {
    clave: CategoriaIncidencia;
    nombre: string;
    descripcion: string;
    color: string;
  }[];
  edificiosCampus: {
    clave: string;
    nombre: string;
    pisos: number;
    aulas: string[];
  }[];
}
