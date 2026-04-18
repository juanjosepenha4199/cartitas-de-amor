import { LetterDetail } from "@/components/letter-detail";

export default async function CartaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LetterDetail id={id} />;
}
