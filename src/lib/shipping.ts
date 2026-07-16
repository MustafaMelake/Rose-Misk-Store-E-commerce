export const CAIRO_GIZA = ["القاهرة", "الجيزة"];

export const UPPER_EGYPT = [
  "بني سويف",
  "الفيوم",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "الوادي الجديد",
  "البحر الأحمر",
];

export const ALL_GOVERNORATES = [
  ...CAIRO_GIZA,
  ...UPPER_EGYPT,
  "الإسكندرية",
  "القليوبية",
  "الدقهلية",
  "الشرقية",
  "الغربية",
  "المنوفية",
  "كفر الشيخ",
  "البحيرة",
  "الإسماعيلية",
  "بورسعيد",
  "السويس",
  "دمياط",
  "شمال سيناء",
  "جنوب سيناء",
  "مطروح",
].sort();

export function calculateShippingFee(governorate: string | undefined): number {
  if (!governorate) return 0;
  const normalizedGov = governorate.trim();

  if (CAIRO_GIZA.includes(normalizedGov)) return 75;
  if (UPPER_EGYPT.includes(normalizedGov)) return 115;

  return 85;
}
