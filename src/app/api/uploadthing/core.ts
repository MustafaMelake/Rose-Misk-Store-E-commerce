import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // سمينا مسار الرفع ده productImage
  // حددنا إننا نقبل صور بس، أقصى حجم 4 ميجا، وبحد أقصى 5 صور للمنتج
  productImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ metadata, file }) => {
    // الكود ده بيشتغل السيرفر بمجرد ما الصورة تترفع بنجاح
    console.log("تم رفع الصورة بنجاح:", file.url);

    // بنرجع الرابط عشان نقدر نستخدمه في الـ Frontend
    return { url: file.url };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
