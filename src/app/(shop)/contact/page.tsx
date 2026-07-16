"use client";
import React, { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Thank you! Your message has been sent.");
    setFormData({ name: "", email: "", message: "" });
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <div className="py-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] overflow-hidden">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <h1 className="text-3xl font-semibold mb-4 prata-regular text-gold-base tracking-wide">
            Contact Us
          </h1>
          <p className="text-gray-600 leading-relaxed dark:text-gray-300">
            We're here to help. Reach out to us anytime and we’ll happily answer
            your questions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* CONTACT FORM */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8 border border-gray-100 dark:border-zinc-800"
          >
            <h2 className="text-xl font-semibold mb-6 dark:text-white flex items-center gap-2">
              Send us a message
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base focus:ring-1 focus:ring-gold-base outline-none transition-all dark:text-gray-200"
              />

              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base focus:ring-1 focus:ring-gold-base outline-none transition-all dark:text-gray-200"
              />

              <textarea
                required
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your message"
                className="w-full p-3 h-32 resize-none rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base focus:ring-1 focus:ring-gold-base outline-none transition-all dark:text-gray-200"
              ></textarea>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="py-3 mt-2 bg-black dark:bg-gold-base text-white dark:text-black rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gold-base hover:text-black dark:hover:bg-gold-light-20 transition-all duration-300 shadow-lg"
              >
                <Send size={18} />
                Send Message
              </motion.button>
            </form>
          </motion.div>

          {/* CONTACT INFO & MAP */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: {
                transition: { staggerChildren: 0.2, delayChildren: 0.4 },
              },
            }}
            className="flex flex-col justify-between space-y-8"
          >
            <div className="space-y-8">
              {/* رابط الواتساب المباشر بالصيغة الدولية */}
              <ContactInfoItem
                icon={<Phone size={20} />}
                title="Phone & WhatsApp"
                detail="+20 111 684 5684"
                href="https://wa.me/201116845684"
                variants={itemVariants}
              />
              {/* رابط الايميل الرسمي الجديد */}
              <ContactInfoItem
                icon={<Mail size={20} />}
                title="Email"
                detail="rosemisk111@gmail.com"
                href="mailto:rosemisk111@gmail.com"
                variants={itemVariants}
              />
              {/* تحديث العنوان لـ منوف المنوفية ورابطه بخرائط جوجل للراحة */}
              <ContactInfoItem
                icon={<MapPin size={20} />}
                title="Location"
                detail="منوف، المنوفية (Menouf, Menofia)"
                href="https://maps.google.com/?q=Menouf,Menofia,Egypt"
                variants={itemVariants}
              />
            </div>

            {/* MAP IMAGE */}
            <motion.div
              variants={itemVariants}
              className="group relative rounded-2xl overflow-hidden shadow-lg h-60 border border-gray-200 dark:border-zinc-800"
            >
              <a
                href="https://maps.google.com/?q=Menouf,Menofia,Egypt"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                <motion.img
                  src={"/location-img.png"}
                  alt="Rose Misk Office Location"
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.7 }}
                />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

interface InfoItemProps {
  icon: React.ReactNode;
  title: string;
  detail: string;
  variants: any;
  href?: string; 
}

const ContactInfoItem: React.FC<InfoItemProps> = ({
  icon,
  title,
  detail,
  variants,
  href,
}) => (
  <motion.div variants={variants} className="flex items-start gap-4 group">
    <motion.div
      whileHover={{ rotate: 15, scale: 1.1 }}
      className="w-12 h-12 rounded-full bg-black dark:bg-gold-base text-white dark:text-black flex items-center justify-center shrink-0 transition-colors shadow-md"
    >
      {icon}
    </motion.div>
    <div>
      <h3 className="text-lg font-semibold dark:text-gold-base">{title}</h3>
      {href ? (
        <a
          href={href}
          target={href.startsWith("mailto:") ? undefined : "_blank"}
          rel="noopener noreferrer"
          className="text-gray-600 dark:text-gray-300 hover:text-gold-base dark:hover:text-gold-base font-medium transition-colors duration-200 block"
        >
          {detail}
        </a>
      ) : (
        <p className="text-gray-600 dark:text-gray-300">{detail}</p>
      )}
    </div>
  </motion.div>
);

export default Contact;
