import { PrismaClient } from "@/app/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const job = prisma.job.create({
      data: {
        title: "Dummy Job",
        company: "Test Corp",
        url: "http://example.com",
      },
    });

    return NextResponse.json({ inserted: job }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
