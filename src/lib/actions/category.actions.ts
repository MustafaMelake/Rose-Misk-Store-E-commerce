"use server";

import { prisma } from "@/lib/prisma";
import { toPublicMessage } from "@/lib/auth-guards";

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: categories };
  } catch (error) {
    // Never leak a raw DB/error message to the client — mask it behind a
    // generic fallback (only PublicError messages pass through).
    console.error("PRISMA ERROR:", error);
    return {
      success: false,
      error: toPublicMessage(error, "Something went wrong."),
    };
  }
}
