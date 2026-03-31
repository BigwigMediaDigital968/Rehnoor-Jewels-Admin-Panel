import ProductForm from "@/app/Component/products/ProductForm";

export const metadata = { title: "Edit Product | Rehnoor Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6 lg:p-8 min-h-full" style={{ background: "#F5F3EE" }}>
      {/* Header */}
      <div className="mb-7">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
          Admin / Products / Edit
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-400 mt-1">
          Update the product details below.
        </p>
      </div>
      <ProductForm mode="edit" productId={id} />
    </div>
  );
}
