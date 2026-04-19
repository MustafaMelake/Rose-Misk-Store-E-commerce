"use server";

import { prisma } from "../prisma";

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: categories };
  } catch (error: any) {
    console.error("PRISMA ERROR:", error);
    return {
      success: false,
      error: error.message || "حدث خطأ ما",
    };
  }
}
