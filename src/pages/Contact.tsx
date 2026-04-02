import React, { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { assets } from "../assets/assets";

const Contact: React.FC = () => {
  // 1. تعريف الـ State للـ Form لضمان السيطرة على البيانات
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // 2. معالجة التغيير في المدخلات مع تحديد نوع الـ Event
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3. معالجة الإرسال (Submit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    // هنا ممكن تضيف منطق إرسال الإيميل (مثل EmailJS أو Resend API)
    alert("Thank you! Your message has been sent.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="py-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] animate-fadeIn">
      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h1 className="text-3xl font-semibold mb-4 prata-regular text-gold-base tracking-wide">
          Contact Us
        </h1>
        <p className="text-gray-600 leading-relaxed dark:text-gray-300">
          We're here to help. Reach out to us anytime and we’ll happily answer
          your questions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* CONTACT FORM */}
        <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8 border border-gray-100 dark:border-zinc-800">
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

            <button
              type="submit"
              className="py-3 mt-2 bg-black dark:bg-gold-base text-white dark:text-black rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gold-base hover:text-black dark:hover:bg-gold-light-20 transition-all duration-300"
            >
              <Send size={18} />
              Send Message
            </button>
          </form>
        </div>

        {/* CONTACT INFO */}
        <div className="flex flex-col justify-between space-y-8">
          <div className="space-y-8">
            <ContactInfoItem
              icon={<Phone size={20} />}
              title="Phone"
              detail="+20 0111 684 5684"
            />
            <ContactInfoItem
              icon={<Mail size={20} />}
              title="Email"
              detail="support@yourbrand.com"
            />
            <ContactInfoItem
              icon={<MapPin size={20} />}
              title="Location"
              detail="Cairo, Egypt"
            />
          </div>

          {/* MAP IMAGE */}
          <div className="group relative rounded-2xl overflow-hidden shadow-lg h-60 border border-gray-200 dark:border-zinc-800">
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full"
            >
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
              <img
                src={assets.Location}
                alt="Rose Misk Office Location"
                className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// مكون فرعي صغير لتنظيم المعلومات
interface InfoItemProps {
  icon: React.ReactNode;
  title: string;
  detail: string;
}

const ContactInfoItem: React.FC<InfoItemProps> = ({ icon, title, detail }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-12 h-12 rounded-full bg-black dark:bg-gold-base text-white dark:text-black flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold dark:text-gold-base">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{detail}</p>
    </div>
  </div>
);

export default Contact;
