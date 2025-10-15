import { NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const user = await prisma.user.create({
      data: {
        email: "test@example.commmm",
        resume_path: "/resumes/test.pdf",
        linkedin_url: "https://linkedin.com/in/test",
      },
    });

    const job = await prisma.job.create({
      data: {
        title: "Frontend Developer",
        company: "Acme Inc",
        url: "https://jobs.acme.com/frontend-dev",
      },
    });

    const users = await prisma.user.findMany();
    const jobs = await prisma.job.findMany();

    return NextResponse.json({ user, job, users, jobs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
