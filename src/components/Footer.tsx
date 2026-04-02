import React from "react";
import { Phone, Facebook, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        <div>
          <span className="text-3xl text-[#D4AF37] prata-regular mb-5">
            ROSE MISK
          </span>
          <p className="w-full md:w-2/3 text-gray-400 dark:text-white">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quibusdam
            consectetur architecto quae ex veritatis? Ratione, dolores? Aut
            veritatis sed nam asperiores iusto fugiat, ipsa accusamus, voluptate
            esse minus optio laudantium.
          </p>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">COMPANY </p>
          <ul className="flex flex-col gap-1 text-gray-600 dark:text-white">
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Our Policy</li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH </p>
          <ul className="flex flex-col gap-2 text-gray-600 dark:text-white">
            <li className="flex items-center gap-2">
              <Phone size={16} /> +20 0111 684 5684
            </li>

            <li className="flex items-center gap-2">
              <a
                className="flex items-center gap-2"
                href="https://www.facebook.com/groups/354827140176261"
                target="_blank"
              >
                <Facebook size={16} /> Facebook
              </a>
            </li>

            <li className="flex items-center gap-2">
              <a
                className="flex items-center gap-2"
                href="https://www.instagram.com/rose_misk_eg/"
                target="_blank"
              >
                <Instagram size={16} /> Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div>
        <hr className="text-gray-200" />
        <p className="py-5 text-center text-sm dark:text-gold-light-20">
          All Copy Right are reserverd from Rose Misk | Website is made by
          Mustafa Melake
        </p>
      </div>
    </>
  );
};

export default Footer;
