import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "../src/app/api/uploadthing/core";

// ده الزرار العادي
export const UploadButton = generateUploadButton<OurFileRouter>();
// ودي مساحة اليوزر يقدر يسحب ويرمي (Drag & Drop) فيها الصور
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
