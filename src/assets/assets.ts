import AngleShare from "./angle-share.png";
import AngleShareP from "./angle-share-p.png";
import Layton from "./layton.png";
import Paradise from "./paradise.jpg";
import SideEffect from "./side-effect.png";
import SpiceBomb from "./spice-bomb.png";
import Tobacco from "./tobacoo.png"; // تعديل الاسم لـ Tobacco
import Logo from "./logo.jpg";
import HeroIMG from "./Hero-img.jpg";
import Elixir from "./Screenshot 2025-11-19 155924.png";
import Location from "./Location.png";

// تعريف الواجهة للمنتج لضمان دقة البيانات في كل المشروع
export interface Product {
  id: number;
  name: string;
  description: string;
  company?: string; // اختياري
  price: number;
  image: string[];
  category: "men" | "women" | "unisex";
  Subcategory: "niche" | "designer";
  size: string[];
  date: Date;
  bestSeller: boolean;
  season?: "winter" | "summer" | "spring" | "autumn";
  rating?: number;
  reviews?: number;
}

export const assets = { Location, Logo, HeroIMG };

export const products: Product[] = [
  {
    id: 1,
    name: "Kilian Angels' Share",
    description:
      "A sophisticated boozy masterpiece, capturing the essence of cognac saved in oak casks.",
    company: "By Kilian",
    price: 100,
    image: [AngleShare],
    category: "men",
    Subcategory: "niche",
    size: ["30ML", "50ML", "100ML"],
    date: new Date("2025-11-13"),
    bestSeller: false,
    season: "winter",
  },
  {
    id: 2,
    name: "Kilian Angels' Share Paradise",
    description:
      "An exotic twist on the original classic, blending warm cognac with tropical warmth.",
    company: "By Kilian",
    price: 150,
    image: [AngleShareP],
    category: "unisex",
    Subcategory: "niche",
    size: ["30ML", "50ML", "100ML"],
    date: new Date("2025-11-13"),
    bestSeller: true,
    rating: 3.5,
    reviews: 56,
  },
  {
    id: 3,
    name: "Parfums de Marly Layton",
    description:
      "An addictive, elegant fragrance that combines fresh lavender with warm vanilla and precious woods.",
    price: 200,
    image: [Layton],
    category: "men",
    Subcategory: "niche",
    size: ["30ML", "50ML", "100ML"],
    date: new Date("2025-11-13"),
    bestSeller: true,
  },
  {
    id: 4,
    name: "Jean Paul Gaultier Le Beau Paradise Garden",
    description:
      "A fresh, green, and aquatic scent that brings a tropical paradise to your everyday summer vibe.",
    company: "JPG",
    price: 90,
    image: [Paradise],
    category: "men",
    Subcategory: "designer",
    size: ["30ML", "50ML", "100ML"],
    date: new Date("2025-11-13"),
    bestSeller: false,
    season: "summer",
  },
  {
    id: 5,
    name: "Initio Side Effect",
    description:
      "A bold combination of tobacco, vanilla, and rum that leaves a powerful and mysterious trail.",
    price: 300,
    image: [SideEffect],
    category: "men",
    Subcategory: "niche",
    size: ["30ML", "50ML", "100ML"],
    date: new Date("2025-11-13"),
    bestSeller: true,
  },
  {
    id: 6,
    name: "Viktor&Rolf Spicebomb Extreme",
    description:
      "An explosion of heat! Intense black pepper and cumin blended with sweet tobacco for cold nights.",
    price: 220,
    image: [SpiceBomb],
    category: "men",
    Subcategory: "designer",
    size: ["30ML", "50ML", "100ML"],
    date: new Date("2025-11-13"),
    bestSeller: true,
  },
  {
    id: 7,
    name: "Tom Ford Tobacco Vanille",
    description:
      "A modern take on an old-world gentleman's club; a classic tobacco scent infused with creamy tonka and vanilla.",
    price: 150,
    image: [Tobacco],
    category: "men",
    Subcategory: "niche",
    size: ["30ML", "50ML", "100ML"],
    date: new Date("2025-11-13"),
    bestSeller: true,
  },
  {
    id: 8,
    name: "Jean Paul Gaultier Le Male Elixir",
    description:
      "A burning-hot fragrance with intense woody-aromatic notes, perfect for the modern confident man.",
    company: "JPG",
    price: 230,
    image: [Elixir],
    category: "men",
    Subcategory: "designer",
    size: ["30ML", "50ML", "100ML"],
    date: new Date("2025-11-13"),
    bestSeller: true,
  },
];
