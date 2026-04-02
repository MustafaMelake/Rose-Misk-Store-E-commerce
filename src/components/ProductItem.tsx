import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

// 1. تعريف أنواع الـ Props اللي المكون بيستقبلها
interface ProductItemProps {
  id: number;
  image: string[];
  name: string;
  price: number;
}

const ProductItem: React.FC<ProductItemProps> = ({
  id,
  image,
  name,
  price,
}) => {
  // 2. الوصول للـ Context مع التأكد إنه مش null
  const context = useContext(ShopContext);

  if (!context) return null;
  const { currency } = context;

  return (
    <Link
      className="text-black cursor-pointer mt-10 block group"
      to={`/product/${id}`}
    >
      <div className="overflow-hidden rounded-xl bg-gray-50 dark:bg-zinc-900">
        <img
          className="hover:scale-110 transition ease-in-out duration-500 w-full aspect-[4/5] object-cover"
          src={image[0]}
          alt={name}
        />
      </div>

      <div className="pt-3 pb-1">
        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
          {name}
        </p>
        <p className="text-sm font-bold text-gold-base mt-1">
          {currency}
          {price.toLocaleString()}
        </p>
      </div>
    </Link>
  );
};

export default ProductItem;
