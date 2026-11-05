import CollectionForm from "../CollectionForm";

export const metadata = { title: "Edit Collection | Rehnoor Admin" };

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionForm mode="edit" collectionId={id} />;
}
