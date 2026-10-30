import TecnicoIncidenciaDetalleClient from './TecnicoIncidenciaDetalleClient';

export default async function TecnicoIncidenciaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TecnicoIncidenciaDetalleClient incidentId={id} />;
}
