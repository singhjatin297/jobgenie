import { NextResponse } from "next/server";
import {
  buildCandidateProfileText,
  buildJobText,
  CandidateResume,
  cosineFromEmbeddings,
  cosineFromText,
  fitBreakdown,
  SearchJob,
  toPercent,
} from "@/lib/matching";

type RankJobsPayload = {
  candidate?: CandidateResume;
  jobs?: SearchJob[];
};

const OLLAMA_URL =
  process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434";
const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL?.trim() || "nomic-embed-text";

const getOllamaEmbedding = async (text: string): Promise<number[] | null> => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_EMBED_MODEL,
        prompt: text,
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;
    const json = (await response.json()) as { embedding?: number[] };
    if (!Array.isArray(json.embedding)) return null;
    return json.embedding;
  } catch {
    return null;
  }
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RankJobsPayload;
    const candidate = body.candidate;
    const jobs = body.jobs ?? [];

    if (!candidate) {
      return NextResponse.json(
        { error: "candidate is required" },
        { status: 400 },
      );
    }

    if (!jobs.length) {
      return NextResponse.json(
        { error: "jobs must contain at least one item" },
        { status: 400 },
      );
    }

    const candidateText = buildCandidateProfileText(candidate);
    const candidateEmbedding = await getOllamaEmbedding(candidateText);
    const scoringMode = candidateEmbedding
      ? "hybrid-embeddings+lexical"
      : "lexical";

    const rankedJobs = await Promise.all(
      jobs.map(async (job) => {
        const jobText = buildJobText(job);
        const lexicalSimilarity = cosineFromText(candidateText, jobText);
        let similarity = lexicalSimilarity;
        let embeddingSimilarity: number | null = null;

        if (candidateEmbedding) {
          const jobEmbedding = await getOllamaEmbedding(jobText);
          if (jobEmbedding) {
            embeddingSimilarity = cosineFromEmbeddings(
              candidateEmbedding,
              jobEmbedding,
            );
            // Hybrid scoring reduces false negatives from wording differences.
            similarity = 0.8 * embeddingSimilarity + 0.2 * lexicalSimilarity;
          }
        }

        const breakdown = fitBreakdown(candidate, jobText);
        const whyMatched = [
          breakdown.matchedSkills.length
            ? `Skill overlap: ${breakdown.matchedSkills.slice(0, 4).join(", ")}`
            : "Role and description align with your profile context.",
          breakdown.seniorityMismatch
            ? `Seniority gap detected: ${breakdown.seniorityMismatch}.`
            : "Experience level appears aligned.",
          breakdown.missingSkills.length
            ? `Missing skills to address: ${breakdown.missingSkills.slice(0, 3).join(", ")}`
            : "No major skill gaps found in extracted requirements.",
        ];

        return {
          ...job,
          matchScore: toPercent(similarity),
          matchSignals: {
            lexical: toPercent(lexicalSimilarity),
            embedding:
              embeddingSimilarity === null ? null : toPercent(embeddingSimilarity),
          },
          whyMatched,
          fitBreakdown: breakdown,
        };
      }),
    );

    rankedJobs.sort((left, right) => (right.matchScore ?? 0) - (left.matchScore ?? 0));

    return NextResponse.json(
      {
        scoringMode,
        totalInputJobs: jobs.length,
        totalRankedJobs: rankedJobs.length,
        rankedJobs,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("rank-jobs API failed", error);
    return NextResponse.json(
      { error: "Unexpected error while ranking jobs" },
      { status: 500 },
    );
  }
}
