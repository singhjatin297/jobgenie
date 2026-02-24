import { PrismaClient } from "@/app/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

type ApplyPayload = {
  jobId?: string;
  role?: string;
  company?: string;
  applyUrl?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ApplyPayload;

    if (!body.role || !body.company || !body.applyUrl) {
      return NextResponse.json(
        { error: "role, company, and applyUrl are required" },
        { status: 400 },
      );
    }

    const saved = await prisma.job.create({
      data: {
        title: body.role,
        company: body.company,
        url: body.applyUrl,
      },
    });

    return NextResponse.json(
      { success: true, applicationId: saved.id, jobId: body.jobId ?? null },
      { status: 200 },
    );
  } catch (error) {
    console.error("Apply API failed", error);
    return NextResponse.json({ error: "Failed to apply" }, { status: 500 });
  }
}
