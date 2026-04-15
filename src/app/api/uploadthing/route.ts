import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// ده اللي بيخلي الـ API يرد على الـ UploadButton
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
