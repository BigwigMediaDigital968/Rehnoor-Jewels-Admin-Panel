import ProductForm from "@/app/Component/products/ProductForm";

export const metadata = { title: "Add Product | Rehnoor Admin" };

export default function AddProductPage() {
  return (
    <div className="p-6 lg:p-8 min-h-full" style={{ background: "#F5F3EE" }}>
      {/* Header */}
      <div className="mb-7">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
          Admin / Products / New
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Add Product</h1>
        <p className="text-sm text-gray-400 mt-1">
          Fill in the details below to list a new product.
        </p>
      </div>
      <ProductForm mode="add" />
    </div>
  );
}
