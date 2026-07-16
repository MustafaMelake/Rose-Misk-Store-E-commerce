import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { requireAdmin } from "@/lib/auth-guards";

const f = createUploadthing();

export const ourFileRouter = {
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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
