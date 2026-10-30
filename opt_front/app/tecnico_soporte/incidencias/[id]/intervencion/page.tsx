import TecnicoIntervencionClient from './TecnicoIntervencionClient';

export default async function TecnicoIntervencionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TecnicoIntervencionClient incidentId={id} />;
}
