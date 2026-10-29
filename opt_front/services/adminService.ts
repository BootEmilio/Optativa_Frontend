import { USE_MOCKS, endpoints, API_BASE_URL } from '@/config/endpoints';
import { ApiError, httpClient } from '@/lib/httpClient';
import { readAuthSession } from '@/lib/authSession';
import { mapIncidencia } from './coordinadorService';
import {
  Incidencia,
  FiltrosIncidencias,
  PrioridadIncidencia,
} from '../types/incidencia';
import { Usuario, TecnicoDisponible } from '../types/usuario';
import {
  AdminMetricas,
  UsuarioFiltros,
  CrearUsuarioPayload,
  ActualizarUsuarioPayload,
  LogAuditoria,
  NuevaIncidenciaAdminPayload,
  CatalogoConfiguracion,
} from '../types/admin';
import { coordinadorService } from './coordinadorService';
import {
  mockAdminActual,
  mockUsuariosIniciales,
  mockLogsAuditoriaIniciales,
  mockConfiguracionSistema,
} from '../data/mockAdminData';

// Estado mutable en memoria para usuarios y logs en modo mock / desarrollo
const usuariosState: Usuario[] = JSON.parse(JSON.stringify(mockUsuariosIniciales));
const logsState: LogAuditoria[] = JSON.parse(JSON.stringify(mockLogsAuditoriaIniciales));

const simularLatencia = async <T>(resultado: T, ms = 80): Promise<T> => {
  return new Promise((resolve) => setTimeout(() => resolve(resultado), ms));
};

function generarId(): string {
  const chars = 'abcdef0123456789';
  let id = '6ad';
  for (let i = 0; i < 21; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function registrarLog(accion: string, detalles: string, modulo: LogAuditoria['modulo'] = 'sistema') {
  const session = readAuthSession();
  const nuevoLog: LogAuditoria = {
    _id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    usuario_id: session?.usuario?.id || mockAdminActual._id,
    usuario_nombre: session?.usuario?.nombre || `${mockAdminActual.nombre} ${mockAdminActual.apellidos}`,
    modulo,
    accion,
    detalles,
    ip: '192.168.10.25 (Sesión Activa)',
  };
  logsState.unshift(nuevoLog);
}

export const adminService = {
  /**
   * Obtiene la sesión actual del administrador
   */
  async getUsuarioActual(): Promise<Usuario> {
    const session = readAuthSession();
    if (session?.usuario) {
      const match = usuariosState.find((u) => u._id === session.usuario.id || u.correo === session.usuario.correo);
      if (match) return { ...match };
      return {
        _id: session.usuario.id,
        nombre: session.usuario.nombre,
        apellidos: '',
        correo: session.usuario.correo,
        rol: 'administrador_sistema',
        activo: true,
        fecha_creacion: new Date().toISOString(),
        area: 'Dirección General de TI',
      };
    }
    return simularLatencia({ ...mockAdminActual });
  },

  /**
   * Métricas maestras consolidadas del campus
   */
  async getMetricasDashboard(): Promise<AdminMetricas> {
    const [coordinadorMetricas, incidencias, tecnicos, usuarios] = await Promise.all([
      coordinadorService.getMetricasDashboard(),
      coordinadorService.getIncidencias(),
      coordinadorService.getTecnicosDisponibles(),
      this.getUsuarios(),
    ]);

    const criticas = incidencias.filter(
      (inc) => inc.prioridad === 'critica' && inc.estado !== 'cerrada'
    ).length;

    const resueltasOCerradas = incidencias.filter(
      (inc) => inc.estado === 'resuelta' || inc.estado === 'cerrada'
    );

    // Calcular tiempo promedio en base a horas invertidas
    let totalHoras = 0;
    let conHoras = 0;
    for (const inc of resueltasOCerradas) {
      if (typeof inc.horas_invertidas === 'number' && inc.horas_invertidas > 0) {
        totalHoras += inc.horas_invertidas;
        conHoras++;
      }
    }

    const tiempoPromedio = conHoras > 0 ? Number((totalHoras / conHoras).toFixed(1)) : 4.2;
    const tasaResolucion =
      incidencias.length > 0
        ? Math.round((resueltasOCerradas.length / incidencias.length) * 100)
        : 88;

    return {
      totalIncidencias: coordinadorMetricas.total,
      pendientesAsignar: coordinadorMetricas.pendientesAsignar,
      enProceso: coordinadorMetricas.enProceso,
      resueltasAuditar: coordinadorMetricas.resueltasAuditar,
      cerradas: coordinadorMetricas.cerradas,
      criticas,
      totalUsuarios: usuarios.length,
      tecnicosActivos: tecnicos.filter((t) => t.activo).length,
      tiempoPromedioResolucionHoras: tiempoPromedio,
      tasaResolucionPorcentaje: tasaResolucion,
    };
  },

  /**
   * Catálogo de Incidencias (Todas las incidencias del campus sin restricción)
   */
  async getIncidencias(filtros?: FiltrosIncidencias): Promise<Incidencia[]> {
    return coordinadorService.getIncidencias(filtros);
  },

  async getIncidenciaById(idOrCodigo: string): Promise<Incidencia | null> {
    return coordinadorService.getIncidenciaById(idOrCodigo);
  },

  /**
   * Registro directo de incidencias por parte del Administrador.
   * Modo real: POST /api/incidencias — el backend deriva reportante del JWT.
   * Modo mock: construye el objeto en memoria.
   */
  async crearIncidencia(payload: NuevaIncidenciaAdminPayload): Promise<Incidencia> {
    if (!USE_MOCKS) {
      // ── Modo real ────────────────────────────────────────────────────────────
      // Solo se envían los campos que el backend acepta; reportante/prioridad/estado
      // son derivados por el servidor a partir del JWT y valores predeterminados.
      const body = {
        titulo: payload.titulo.trim(),
        descripcion: payload.descripcion.trim(),
        categoria: payload.categoria,
        ubicacion: payload.ubicacion,
        detalle_especifico: payload.detalle_especifico,
        tags: payload.tags ?? [],
        evidencias_adjuntas: payload.evidencias_adjuntas ?? [],
      };

      try {
        const raw = await httpClient<unknown>(endpoints.incidencias.list, {
          method: 'POST',
          body,
        });
        registrarLog(
          'Creación de Incidencia',
          `Registró incidencia "${payload.titulo}"`,
          'incidencias'
        );
        return mapIncidencia(raw);
      } catch (err) {
        // Re-lanza con mensaje legible
        if (err instanceof ApiError) throw err;
        throw new Error('No se pudo crear la incidencia. Verifica tu conexión.');
      }
    }

    // ── Modo mock ──────────────────────────────────────────────────────────────
    const codigoNumero = 100 + Math.floor(Math.random() * 900);
    const codigo = `INC-2026-0${codigoNumero}`;
    const id = generarId();
    const adminUser = await this.getUsuarioActual();

    const nueva: Incidencia = {
      _id: id,
      codigo,
      titulo: payload.titulo.trim(),
      descripcion: payload.descripcion?.trim() ?? '',
      categoria: payload.categoria,
      prioridad: 'media',
      estado: 'abierta',
      reportante: {
        usuario_id: adminUser._id,
        nombre: `${adminUser.nombre} ${adminUser.apellidos}`,
        tipo: adminUser.tipo_reportante ?? 'estudiante',
        administrador_sistema: adminUser.rol === 'administrador_sistema',
      },
      tecnico_asignado: null,
      ubicacion: payload.ubicacion ?? { edificio: '' },
      detalle_especifico: payload.detalle_especifico,
      tags: payload.tags || [],
      evidencias_adjuntas: payload.evidencias_adjuntas,
      fecha_creacion: new Date().toISOString(),
      historial_seguimiento: [
        {
          fecha: new Date().toISOString(),
          usuario_id: adminUser._id,
          autor: `${adminUser.nombre} ${adminUser.apellidos} (Administrador)`,
          accion: 'creacion',
          estado_nuevo: 'abierta',
          comentario: 'Incidencia registrada por el Administrador. Pendiente de asignación.',
        },
      ],
    };

    registrarLog(
      'Creación de Incidencia',
      `Registró la incidencia ${codigo}: "${payload.titulo}"`,
      'incidencias'
    );
    return simularLatencia(nueva);
  },

  /**
   * Operaciones sobre Incidencias (Asignar, Prioridad, Cierre, Reapertura, Tags)
   */
  async asignarTecnico(
    incidenciaId: string,
    tecnicoId: string,
    comentarioPersonalizado?: string
  ): Promise<Incidencia> {
    const res = await coordinadorService.asignarTecnico(
      incidenciaId,
      tecnicoId,
      comentarioPersonalizado
    );
    registrarLog('Asignación de Técnico', `Asignó técnico a la incidencia ${incidenciaId}`, 'incidencias');
    return res;
  },

  async establecerPrioridad(
    incidenciaId: string,
    nuevaPrioridad: PrioridadIncidencia,
    motivo?: string
  ): Promise<Incidencia> {
    const res = await coordinadorService.establecerPrioridad(
      incidenciaId,
      nuevaPrioridad,
      motivo
    );
    registrarLog('Cambio de Prioridad', `Moduló prioridad a ${nuevaPrioridad.toUpperCase()} en incidencia ${incidenciaId}`, 'incidencias');
    return res;
  },

  async cerrarIncidencia(
    incidenciaId: string,
    comentarioAuditoria: string
  ): Promise<Incidencia> {
    const res = await coordinadorService.cerrarIncidencia(
      incidenciaId,
      comentarioAuditoria
    );
    registrarLog('Auditoría y Cierre', `Auditoría conforme y cierre de incidencia ${incidenciaId}`, 'incidencias');
    return res;
  },

  async reabrirIncidencia(
    incidenciaId: string,
    motivoReapertura: string
  ): Promise<Incidencia> {
    const res = await coordinadorService.reabrirIncidencia(
      incidenciaId,
      motivoReapertura
    );
    registrarLog('Reapertura de Ticket', `Reabrió incidencia ${incidenciaId} por motivo: ${motivoReapertura}`, 'incidencias');
    return res;
  },

  async agregarTag(incidenciaId: string, tag: string): Promise<Incidencia> {
    return coordinadorService.agregarTag(incidenciaId, tag);
  },

  async eliminarTag(incidenciaId: string, tag: string): Promise<Incidencia> {
    return coordinadorService.eliminarTag(incidenciaId, tag);
  },

  async getTecnicosDisponibles(): Promise<TecnicoDisponible[]> {
    return coordinadorService.getTecnicosDisponibles();
  },

  /**
   * Gestión Integral de Usuarios y Roles Institucionales
   */
  async getUsuarios(filtros?: UsuarioFiltros): Promise<Usuario[]> {
    if (!USE_MOCKS) {
      try {
        const raw = await httpClient<Usuario[] | { data: Usuario[] }>(
          endpoints.admin.usuarios,
          { method: 'GET' }
        );
        const list = Array.isArray(raw)
          ? raw
          : raw && typeof raw === 'object' && Array.isArray((raw as { data?: Usuario[] }).data)
          ? (raw as { data: Usuario[] }).data
          : null;
        if (list && list.length > 0) return list;
      } catch {
        // En caso de que el backend no tenga listo /api/admin/usuarios todavía, fallback a datos locales
      }
    }

    let resultado = [...usuariosState];
    if (filtros) {
      if (filtros.rol && filtros.rol !== 'todos') {
        resultado = resultado.filter((u) => u.rol === filtros.rol);
      }
      if (filtros.activo !== undefined && filtros.activo !== 'todos') {
        resultado = resultado.filter((u) => u.activo === filtros.activo);
      }
      if (filtros.busqueda && filtros.busqueda.trim()) {
        const q = filtros.busqueda.toLowerCase();
        resultado = resultado.filter(
          (u) =>
            u.nombre.toLowerCase().includes(q) ||
            u.apellidos.toLowerCase().includes(q) ||
            u.correo.toLowerCase().includes(q) ||
            (u.area && u.area.toLowerCase().includes(q))
        );
      }
    }
    return simularLatencia(resultado);
  },

  async crearUsuario(payload: CrearUsuarioPayload): Promise<Usuario> {
    const nuevoUsuario: Usuario = {
      _id: generarId(),
      nombre: payload.nombre.trim(),
      apellidos: payload.apellidos.trim(),
      correo: payload.correo.trim().toLowerCase(),
      rol: payload.rol,
      area: payload.area.trim(),
      telefono: payload.telefono?.trim(),
      tipo_reportante: payload.tipo_reportante,
      activo: true,
      fecha_creacion: new Date().toISOString(),
    };

    usuariosState.unshift(nuevoUsuario);
    registrarLog('Alta de Usuario', `Registró al usuario ${nuevoUsuario.nombre} ${nuevoUsuario.apellidos} con rol ${nuevoUsuario.rol}`, 'usuarios');
    return simularLatencia(nuevoUsuario);
  },

  async actualizarUsuario(id: string, payload: ActualizarUsuarioPayload): Promise<Usuario> {
    const idx = usuariosState.findIndex((u) => u._id === id);
    if (idx === -1) throw new Error('Usuario no encontrado');

    const actualizado: Usuario = {
      ...usuariosState[idx],
      ...payload,
    };
    usuariosState[idx] = actualizado;
    registrarLog('Actualización de Usuario', `Actualizó datos del usuario ${actualizado.nombre} (${actualizado.correo})`, 'usuarios');
    return simularLatencia(actualizado);
  },

  async toggleUsuarioActivo(id: string): Promise<Usuario> {
    const idx = usuariosState.findIndex((u) => u._id === id);
    if (idx === -1) throw new Error('Usuario no encontrado');

    const nuevoEstado = !usuariosState[idx].activo;
    usuariosState[idx] = {
      ...usuariosState[idx],
      activo: nuevoEstado,
    };

    registrarLog('Cambio de Estado', `Cambió estado de usuario a ${nuevoEstado ? 'Activo' : 'Suspendido'}`, 'usuarios');
    return simularLatencia(usuariosState[idx]);
  },

  /**
   * Logs y Auditoría Global de la Plataforma
   */
  async getLogsAuditoria(limite = 10): Promise<LogAuditoria[]> {
    return simularLatencia(logsState.slice(0, limite));
  },

  /**
   * Configuración de la Plataforma y Catálogos
   */
  async getConfiguracion(): Promise<CatalogoConfiguracion> {
    return simularLatencia({
      ...mockConfiguracionSistema,
      apiUrl: API_BASE_URL,
      modoMocks: USE_MOCKS,
    });
  },

  /**
   * Analítica y Distribuciones Unificadas
   */
  async getAnaliticaData(periodo: 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days' = 'this_month') {
    const incidencias = await coordinadorService.getIncidencias();

    // Distribución por categoría
    const porCategoria = {
      computo_redes: incidencias.filter((i) => i.categoria === 'computo_redes').length,
      infraestructura: incidencias.filter((i) => i.categoria === 'infraestructura').length,
      academico: incidencias.filter((i) => i.categoria === 'academico').length,
    };

    // Distribución por estado
    const porEstado = {
      abierta: incidencias.filter((i) => i.estado === 'abierta').length,
      en_proceso: incidencias.filter((i) => i.estado === 'en_proceso').length,
      resuelta: incidencias.filter((i) => i.estado === 'resuelta').length,
      cerrada: incidencias.filter((i) => i.estado === 'cerrada').length,
      reabierta: incidencias.filter((i) => i.estado === 'reabierta').length,
    };

    // Distribución por prioridad
    const porPrioridad = {
      critica: incidencias.filter((i) => i.prioridad === 'critica').length,
      alta: incidencias.filter((i) => i.prioridad === 'alta').length,
      media: incidencias.filter((i) => i.prioridad === 'media').length,
      baja: incidencias.filter((i) => i.prioridad === 'baja').length,
    };

    // Distribución por edificios
    const porEdificio: Record<string, number> = {};
    for (const inc of incidencias) {
      const ed = inc.ubicacion.edificio || 'General';
      porEdificio[ed] = (porEdificio[ed] || 0) + 1;
    }

    // Fallas recurrentes analizadas
    const fallasRecurrentes = [
      {
        problema: 'Pérdida de conectividad Switch / Uplink',
        ubicacion: 'Edificio C — Laboratorios de Cómputo',
        totalOcurrencias: 5,
        categoria: 'computo_redes',
        slaCumplido: '92%',
      },
      {
        problema: 'Interrupción en Proyector HDMI / Señal débil',
        ubicacion: 'Edificio A — Aulas Generales',
        totalOcurrencias: 4,
        categoria: 'academico',
        slaCumplido: '88%',
      },
      {
        problema: 'Caída de tensión en respaldo UPS central',
        ubicacion: 'Edificio B — Site Central',
        totalOcurrencias: 3,
        categoria: 'infraestructura',
        slaCumplido: '100%',
      },
      {
        problema: 'Falla de autenticación Portal de Alumnos',
        ubicacion: 'Campus Central / Nube',
        totalOcurrencias: 2,
        categoria: 'academico',
        slaCumplido: '95%',
      },
    ];

    return {
      periodo,
      totalIncidencias: incidencias.length,
      distribucionCategoria: [
        { label: 'Cómputo y Redes', count: porCategoria.computo_redes, color: '#3E828E' },
        { label: 'Infraestructura y Mtto.', count: porCategoria.infraestructura, color: '#E09F3E' },
        { label: 'Sistemas Académicos', count: porCategoria.academico, color: '#8A5082' },
      ],
      distribucionEstado: [
        { label: 'Abierta', count: porEstado.abierta, color: '#EAB308' },
        { label: 'En Proceso', count: porEstado.en_proceso, color: '#0284C7' },
        { label: 'Resuelta', count: porEstado.resuelta, color: '#0D9488' },
        { label: 'Cerrada', count: porEstado.cerrada, color: '#64748B' },
        { label: 'Reabierta', count: porEstado.reabierta, color: '#9333EA' },
      ],
      distribucionPrioridad: [
        { label: 'Crítica', count: porPrioridad.critica, color: '#EF4444' },
        { label: 'Alta', count: porPrioridad.alta, color: '#F97316' },
        { label: 'Media', count: porPrioridad.media, color: '#3B82F6' },
        { label: 'Baja', count: porPrioridad.baja, color: '#64748B' },
      ],
      distribucionEdificio: Object.entries(porEdificio).map(([ed, count]) => ({
        label: `Edificio ${ed}`,
        count,
      })),
      fallasRecurrentes,
      tiemposResolucion: {
        promedioHoras: 4.2,
        criticaHoras: 1.8,
        altaHoras: 3.5,
        mediaHoras: 6.2,
        bajaHoras: 12.0,
        tasaSla: 94.5,
      },
    };
  },
};
