import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  buildEvidencePack,
  CandidateResume,
  cosineFromText,
  extractSkillsFromText,
  fitBreakdown,
  normalizeText,
} from "@/lib/matching";

type TailorPayload = {
  candidate?: CandidateResume;
  job?: {
    title?: string;
    company?: string;
    description?: string;
    requirements?: string;
    location?: string;
  };
};

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

const selectRelevantLines = (jobText: string, lines: string[], take = 5) =>
  [...lines]
    .map((line) => ({
      line,
      score: cosineFromText(jobText, normalizeText(line)),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, take)
    .map((item) => item.line);

const fallbackDraft = (candidate: CandidateResume, payload: TailorPayload["job"]) => {
  const evidence = buildEvidencePack(candidate);
  const jobText = `${payload?.title ?? ""} ${payload?.description ?? ""} ${payload?.requirements ?? ""}`;
  const selectedExperience = selectRelevantLines(jobText, evidence.workBullets, 4);
  const selectedProjects = selectRelevantLines(jobText, evidence.projectBullets, 2);
  const jdSkills = extractSkillsFromText(jobText, evidence.skills);
  const matchedSkills = jdSkills.filter((skill) =>
    evidence.skills.some((candidateSkill) => candidateSkill.toLowerCase() === skill),
  );
  const missingSkills = jdSkills.filter((skill) => !matchedSkills.includes(skill));
  const breakdown = fitBreakdown(candidate, jobText);

  return {
    summary: `${evidence.currentTitle || "Software professional"} with ${evidence.yearsOfExperience} years of experience targeting ${payload?.title ?? "this role"} at ${payload?.company ?? "the company"}.`,
    skills: [...new Set([...matchedSkills, ...evidence.skills])].slice(0, 12),
    selectedExperience,
    selectedProjects,
    missingRequirements: [
      ...missingSkills.slice(0, 5),
      ...(breakdown.seniorityMismatch ? [breakdown.seniorityMismatch] : []),
    ],
    groundingNote:
      "Generated from resume evidence only. Missing requirements are listed instead of invented.",
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TailorPayload;
    const candidate = body.candidate;
    const job = body.job;

    if (!candidate || !job) {
      return NextResponse.json(
        { error: "candidate and job are required" },
        { status: 400 },
      );
    }

    const evidence = buildEvidencePack(candidate);
    const fallback = fallbackDraft(candidate, job);

    if (!groq) {
      return NextResponse.json(
        { mode: "fallback", tailoredDraft: fallback },
        { status: 200 },
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You tailor resumes safely. Return a valid JSON object only. Use only facts from evidence pack. Never invent projects, tools, employers, dates, impact, or achievements. If a requirement is missing, include it under missingRequirements.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Create a tailored resume draft",
            responseType: "json",
            outputSchema: {
              summary: "string",
              skills: ["string"],
              selectedExperience: ["string"],
              selectedProjects: ["string"],
              missingRequirements: ["string"],
              groundingNote: "string",
            },
            job,
            evidence,
          }),
        },
      ],
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { mode: "fallback", tailoredDraft: fallback },
        { status: 200 },
      );
    }

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(
        { mode: "groq-grounded", tailoredDraft: parsed },
        { status: 200 },
      );
    } catch {
      return NextResponse.json(
        { mode: "fallback", tailoredDraft: fallback },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("tailor-resume API failed", error);
    return NextResponse.json(
      { error: "Unexpected error while tailoring resume" },
      { status: 500 },
    );
  }
}
