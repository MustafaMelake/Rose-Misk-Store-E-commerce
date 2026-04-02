import React from "react";

const NewsLetterBox: React.FC = () => {
  // تعريف نوع الـ event كـ FormEvent من مكتبة React
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // منطق الإرسال يمكن أن يضاف هنا مستقبلاً
    const target = e.currentTarget;
    const emailInput = target.elements.namedItem("email") as HTMLInputElement;
    console.log("Subscribing with:", emailInput?.value);
  };

  return (
    <div className="text-center">
      <p className="text-2xl font-medium text-gold-light-20">
        Subscribe Now & Get 20% OFF!
      </p>
      <p className="text-gray-400 mt-3 dark:text-white">
        Join our exclusive fragrance community and be the first to know about
        new arrivals and private sales.
      </p>

      <form
        onSubmit={onSubmit}
        className="w-full flex items-center mx-auto sm:w-1/2 gap-3 border my-6 pl-3 dark:border-white"
      >
        <input
          name="email" // إضافة name لسهولة الوصول للبيانات في TS
          type="email"
          className="w-full sm:flex-1 outline-none dark:text-white bg-white dark:bg-black"
          placeholder="Enter Your Email"
          required
        />
        <button
          type="submit"
          className="bg-black dark:bg-white dark:text-black text-white text-xs px-10 py-5 transition-all hover:opacity-80"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
};

export default NewsLetterBox;
