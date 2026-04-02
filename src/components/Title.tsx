import React from "react";

// 1. تعريف أنواع الـ Props
interface TitleProps {
  text1: string;
  text2: string;
}

// 2. استخدام النوع React.FC مع الـ Interface
const Title: React.FC<TitleProps> = ({ text1, text2 }) => {
  return (
    <div className="inline-flex gap-2 items-center mb-3">
      <p className="text-gold-light-20">
        {text1} <span className="font-medium text-gold-base">{text2}</span>
      </p>
      {/* إضافة خط ديكوري ليعطي طابع الفخامة للمتجر */}
      <p className="w-8 sm:w-12 h-[1px] sm:h-[2px] bg-gold-base"></p>
    </div>
  );
};

export default Title;
