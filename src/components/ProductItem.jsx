import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const ProductItem = ({ id, image, name, price }) => {
  const { currency } = useContext(ShopContext);

  return (
    <Link className="text-black cursor-pointer mt-10" to={`/product/${id}`}>
      <div className="overflow-hidden">
        <img
          className="hover:scale-110 transition ease-in-out duration-300 rounded-xl"
          src={image[0]}
          alt={name}
        />
        <p className="pt-3 pb-1 text-sm dark:text-white">{name}</p>
        <p className="text-sm font-medium dark:text-white">
          {currency}
          {price}
        </p>
      </div>
    </Link>
  );
};

export default ProductItem;
