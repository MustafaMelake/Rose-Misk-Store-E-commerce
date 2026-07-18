"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProduct } from "@/lib/actions/product.actions";

export default function DeleteProductButton({ id }: { id: number }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setIsDeleting(true);
    const result = await deleteProduct(id);
    if (!result.success) {
      alert(result.error);
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
