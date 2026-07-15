import { createUploadthing, type FileRouter } from "uploadthing/next";
<<<<<<< HEAD
=======
import { UploadThingError } from "uploadthing/server";
import { requireAdmin } from "@/lib/auth-guards";
>>>>>>> client-release

const f = createUploadthing();

export const ourFileRouter = {
<<<<<<< HEAD
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
=======
  productImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    // Only authenticated admins may upload product images. This runs on the
    // server before the upload is authorized; throwing rejects the request.
    .middleware(async () => {
      try {
        const admin = await requireAdmin();
        return { userId: admin.id };
      } catch {
        throw new UploadThingError("Unauthorized");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Product image uploaded by admin:", metadata.userId, file.ufsUrl);
      // Return the canonical file URL to the client.
      return { url: file.ufsUrl };
    }),
>>>>>>> client-release
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
