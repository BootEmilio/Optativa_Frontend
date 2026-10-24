import {
  Incidencia,
  EstadoIncidencia,
  PrioridadIncidencia,
  FiltrosIncidencias,
  HistorialSeguimiento,
} from '../types/incidencia';
import { TecnicoDisponible, Usuario } from '../types/usuario';
import {
  mockIncidenciasIniciales,
  mockTecnicosDisponibles,
  mockCoordinadorActual,
} from '../data/mockCoordinadorData';

const incidenciasState: Incidencia[] = JSON.parse(
  JSON.stringify(mockIncidenciasIniciales)
);
const tecnicosState: TecnicoDisponible[] = JSON.parse(
  JSON.stringify(mockTecnicosDisponibles)
);

const simularLatencia = async <T>(resultado: T, ms = 80): Promise<T> => {
  return new Promise((resolve) => setTimeout(() => resolve(resultado), ms));
};

function autorSesion() {
  return {
    usuario_id: mockCoordinadorActual._id,
    autor: `${mockCoordinadorActual.nombre} ${mockCoordinadorActual.apellidos}`,
  };
}

export const coordinadorMock = {
  async getUsuarioActual(): Promise<Usuario> {
    return simularLatencia({ ...mockCoordinadorActual });
  },

  async getIncidencias(filtros?: FiltrosIncidencias): Promise<Incidencia[]> {
    let resultado = [...incidenciasState];

    if (filtros) {
      if (filtros.estado && filtros.estado !== 'todos') {
        resultado = resultado.filter((inc) => inc.estado === filtros.estado);
      }
      if (filtros.prioridad && filtros.prioridad !== 'todas') {
        resultado = resultado.filter(
          (inc) => inc.prioridad === filtros.prioridad
        );
      }
      if (filtros.categoria && filtros.categoria !== 'todas') {
        resultado = resultado.filter(
          (inc) => inc.categoria === filtros.categoria
        );
      }
      if (filtros.busqueda && filtros.busqueda.trim() !== '') {
        const query = filtros.busqueda.toLowerCase();
        resultado = resultado.filter(
          (inc) =>
            inc.codigo.toLowerCase().includes(query) ||
            inc.titulo.toLowerCase().includes(query) ||
            inc.descripcion.toLowerCase().includes(query) ||
            (inc.tecnico_asignado?.nombre || '').toLowerCase().includes(query) ||
            inc.reportante.nombre.toLowerCase().includes(query) ||
            inc.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }
    }

    resultado.sort(
      (a, b) =>
        new Date(b.fecha_creacion).getTime() -
        new Date(a.fecha_creacion).getTime()
    );

    return simularLatencia(resultado);
  },

  async getIncidenciaById(idOrCodigo: string): Promise<Incidencia | null> {
    const encontrada = incidenciasState.find(
      (inc) => inc._id === idOrCodigo || inc.codigo === idOrCodigo
    );
    return simularLatencia(encontrada ? { ...encontrada } : null);
  },

  async getTecnicosDisponibles(): Promise<TecnicoDisponible[]> {
    return simularLatencia([...tecnicosState]);
  },

  async asignarTecnico(
    incidenciaId: string,
    tecnicoId: string,
    comentarioPersonalizado?: string
  ): Promise<Incidencia> {
    const index = incidenciasState.findIndex((inc) => inc._id === incidenciaId);
    if (index === -1) {
      throw new Error(`Incidencia con ID ${incidenciaId} no encontrada`);
    }

    const tecnico = tecnicosState.find((tec) => tec._id === tecnicoId);
    if (!tecnico) {
      throw new Error(`Técnico con ID ${tecnicoId} no encontrado`);
    }

    const incidenciaActual = incidenciasState[index];
    const esReasignacion = !!incidenciaActual.tecnico_asignado;
    const accion = esReasignacion ? 'reasignacion' : 'asignacion';

    const nuevoEstado: EstadoIncidencia =
      incidenciaActual.estado === 'abierta'
        ? 'en_proceso'
        : incidenciaActual.estado;

    const nuevoSeguimiento: HistorialSeguimiento = {
      fecha: new Date().toISOString(),
      ...autorSesion(),
      accion: accion,
      estado_nuevo: nuevoEstado,
      comentario:
        comentarioPersonalizado ||
        (esReasignacion
          ? `Incidencia reasignada al técnico ${tecnico.nombre} ${tecnico.apellidos}.`
          : `Técnico asignado: ${tecnico.nombre} ${tecnico.apellidos}.`),
    };

    const incidenciaActualizada: Incidencia = {
      ...incidenciaActual,
      estado: nuevoEstado,
      tecnico_asignado: {
        usuario_id: tecnico._id,
        nombre: `${tecnico.nombre} ${tecnico.apellidos}`,
        correo: tecnico.correo,
      },
      historial_seguimiento: [
        ...incidenciaActual.historial_seguimiento,
        nuevoSeguimiento,
      ],
    };

    incidenciasState[index] = incidenciaActualizada;
    return simularLatencia({ ...incidenciaActualizada });
  },

  async establecerPrioridad(
    incidenciaId: string,
    nuevaPrioridad: PrioridadIncidencia,
    motivo?: string
  ): Promise<Incidencia> {
    const index = incidenciasState.findIndex((inc) => inc._id === incidenciaId);
    if (index === -1) {
      throw new Error(`Incidencia con ID ${incidenciaId} no encontrada`);
    }

    const incidenciaActual = incidenciasState[index];
    const prioridadAnterior = incidenciaActual.prioridad;

    const nuevoSeguimiento: HistorialSeguimiento = {
      fecha: new Date().toISOString(),
      ...autorSesion(),
      accion: 'cambio_prioridad',
      estado_nuevo: incidenciaActual.estado,
      comentario:
        motivo ||
        `Prioridad actualizada de '${prioridadAnterior.toUpperCase()}' a '${nuevaPrioridad.toUpperCase()}'.`,
    };

    const incidenciaActualizada: Incidencia = {
      ...incidenciaActual,
      prioridad: nuevaPrioridad,
      historial_seguimiento: [
        ...incidenciaActual.historial_seguimiento,
        nuevoSeguimiento,
      ],
    };

    incidenciasState[index] = incidenciaActualizada;
    return simularLatencia({ ...incidenciaActualizada });
  },

  async cerrarIncidencia(
    incidenciaId: string,
    comentarioAuditoria: string
  ): Promise<Incidencia> {
    const index = incidenciasState.findIndex((inc) => inc._id === incidenciaId);
    if (index === -1) {
      throw new Error(`Incidencia con ID ${incidenciaId} no encontrada`);
    }

    const incidenciaActual = incidenciasState[index];
    if (incidenciaActual.estado !== 'resuelta') {
      throw new Error(
        'Solo se puede autorizar el cierre de una incidencia en estado resuelta.'
      );
    }

    const fechaActual = new Date().toISOString();
    const nuevoSeguimiento: HistorialSeguimiento = {
      fecha: fechaActual,
      ...autorSesion(),
      accion: 'cierre',
      estado_nuevo: 'cerrada',
      comentario:
        comentarioAuditoria ||
        'Se valida la solución técnica y se autoriza el cierre formal del ticket.',
    };

    const incidenciaActualizada: Incidencia = {
      ...incidenciaActual,
      estado: 'cerrada',
      fecha_cierre: fechaActual,
      historial_seguimiento: [
        ...incidenciaActual.historial_seguimiento,
        nuevoSeguimiento,
      ],
    };

    incidenciasState[index] = incidenciaActualizada;
    return simularLatencia({ ...incidenciaActualizada });
  },

  async reabrirIncidencia(
    incidenciaId: string,
    motivoReapertura: string
  ): Promise<Incidencia> {
    const index = incidenciasState.findIndex((inc) => inc._id === incidenciaId);
    if (index === -1) {
      throw new Error(`Incidencia con ID ${incidenciaId} no encontrada`);
    }

    const incidenciaActual = incidenciasState[index];
    if (
      incidenciaActual.estado !== 'cerrada' &&
      incidenciaActual.estado !== 'resuelta'
    ) {
      throw new Error(
        'Solo se puede reabrir una incidencia cerrada o resuelta (auditoría rechazada).'
      );
    }

    const nuevoSeguimiento: HistorialSeguimiento = {
      fecha: new Date().toISOString(),
      ...autorSesion(),
      accion: 'reapertura',
      estado_nuevo: 'reabierta',
      comentario:
        motivoReapertura ||
        'La incidencia ha sido reabierta por el coordinador debido a observaciones en la solución.',
    };

    const incidenciaActualizada: Incidencia = {
      ...incidenciaActual,
      estado: 'reabierta',
      historial_seguimiento: [
        ...incidenciaActual.historial_seguimiento,
        nuevoSeguimiento,
      ],
    };

    incidenciasState[index] = incidenciaActualizada;
    return simularLatencia({ ...incidenciaActualizada });
  },

  async agregarTag(incidenciaId: string, tag: string): Promise<Incidencia> {
    const index = incidenciasState.findIndex((inc) => inc._id === incidenciaId);
    if (index === -1) {
      throw new Error(`Incidencia con ID ${incidenciaId} no encontrada`);
    }

    const tagLimpio = tag.trim().toLowerCase();
    if (!tagLimpio) {
      return incidenciasState[index];
    }

    const incidenciaActual = incidenciasState[index];

    if (incidenciaActual.tags.includes(tagLimpio)) {
      return simularLatencia({ ...incidenciaActual });
    }

    const tagsNuevos = [...incidenciaActual.tags, tagLimpio];

    const nuevoSeguimiento: HistorialSeguimiento = {
      fecha: new Date().toISOString(),
      ...autorSesion(),
      accion: 'cambio_tags',
      comentario: `Se agregó la etiqueta técnica '${tagLimpio}'.`,
    };

    const incidenciaActualizada: Incidencia = {
      ...incidenciaActual,
      tags: tagsNuevos,
      historial_seguimiento: [
        ...incidenciaActual.historial_seguimiento,
        nuevoSeguimiento,
      ],
    };

    incidenciasState[index] = incidenciaActualizada;
    return simularLatencia({ ...incidenciaActualizada });
  },

  async eliminarTag(incidenciaId: string, tag: string): Promise<Incidencia> {
    const index = incidenciasState.findIndex((inc) => inc._id === incidenciaId);
    if (index === -1) {
      throw new Error(`Incidencia con ID ${incidenciaId} no encontrada`);
    }

    const tagLimpio = tag.trim().toLowerCase();
    const incidenciaActual = incidenciasState[index];
    const tagsNuevos = incidenciaActual.tags.filter((t) => t !== tagLimpio);

    const nuevoSeguimiento: HistorialSeguimiento = {
      fecha: new Date().toISOString(),
      ...autorSesion(),
      accion: 'cambio_tags',
      comentario: `Se eliminó la etiqueta técnica '${tagLimpio}'.`,
    };

    const incidenciaActualizada: Incidencia = {
      ...incidenciaActual,
      tags: tagsNuevos,
      historial_seguimiento: [
        ...incidenciaActual.historial_seguimiento,
        nuevoSeguimiento,
      ],
    };

    incidenciasState[index] = incidenciaActualizada;
    return simularLatencia({ ...incidenciaActualizada });
  },

  async getMetricasDashboard(): Promise<{
    pendientesAsignar: number;
    enProceso: number;
    resueltasAuditar: number;
    cerradas: number;
    total: number;
  }> {
    const pendientesAsignar = incidenciasState.filter(
      (inc) =>
        inc.estado === 'abierta' &&
        (!inc.tecnico_asignado || !inc.tecnico_asignado.usuario_id)
    ).length;

    const enProceso = incidenciasState.filter(
      (inc) => inc.estado === 'en_proceso'
    ).length;

    const resueltasAuditar = incidenciasState.filter(
      (inc) => inc.estado === 'resuelta'
    ).length;

    const cerradas = incidenciasState.filter(
      (inc) => inc.estado === 'cerrada'
    ).length;

    return simularLatencia({
      pendientesAsignar,
      enProceso,
      resueltasAuditar,
      cerradas,
      total: incidenciasState.length,
    });
  },

  async getActividadReciente(limite = 5): Promise<
    Array<{
      incidenciaId: string;
      codigo: string;
      titulo: string;
      autor: string;
      accion: string;
      fecha: string;
      comentario: string;
      estadoNuevo?: string;
    }>
  > {
    const todosEventos: Array<{
      incidenciaId: string;
      codigo: string;
      titulo: string;
      autor: string;
      accion: string;
      fecha: string;
      comentario: string;
      estadoNuevo?: string;
    }> = [];

    for (const inc of incidenciasState) {
      for (const seg of inc.historial_seguimiento) {
        todosEventos.push({
          incidenciaId: inc._id,
          codigo: inc.codigo,
          titulo: inc.titulo,
          autor: seg.autor,
          accion: seg.accion,
          fecha: seg.fecha,
          comentario: seg.comentario,
          estadoNuevo: seg.estado_nuevo,
        });
      }
    }

    todosEventos.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    return simularLatencia(todosEventos.slice(0, limite));
  },
};
