import { NextResponse } from "next/server";

const API_HOST = "jsearch.p.rapidapi.com";
const DEFAULT_MAX_PAGES = 5;
const ABSOLUTE_MAX_PAGES = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawPage = searchParams.get("page");
  const rawMaxPages = searchParams.get("max_pages");
  const query = searchParams.get("query");
  const country = searchParams.get("country") ?? "in";
  const page = rawPage && !isNaN(Number(rawPage)) ? Number(rawPage) : 1;
  const parsedMaxPages = rawMaxPages && !isNaN(Number(rawMaxPages))
    ? Number(rawMaxPages)
    : DEFAULT_MAX_PAGES;
  const maxPages = Math.min(
    ABSOLUTE_MAX_PAGES,
    Math.max(1, parsedMaxPages),
  );

  if (!query) {
    return NextResponse.json(
      { error: "Job Title is required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.RAPID_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "RapidAPI key is not configured" },
      { status: 500 },
    );
  }

  try {
    const requestHeaders = {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": API_HOST,
    };

    let firstPayload: any = null;
    const allJobs: Array<{ job_id?: string }> = [];

    for (let offset = 0; offset < maxPages; offset += 1) {
      const currentPage = page + offset;
      const params = new URLSearchParams({
        query,
        country,
        page: String(currentPage),
      });

      const response = await fetch(
        `https://${API_HOST}/search?${params.toString()}`,
        {
          method: "GET",
          headers: requestHeaders,
          cache: "no-store",
        },
      );

      if (!response.ok) {
        if (offset === 0) {
          const text = await response.text();
          return NextResponse.json(
            { error: "Failed to fetch jobs", details: text },
            { status: response.status },
          );
        }
        break;
      }

      const payload = (await response.json()) as { data?: Array<{ job_id?: string }> };
      if (!firstPayload) firstPayload = payload;
      const jobs = Array.isArray(payload.data) ? payload.data : [];
      if (!jobs.length) break;
      allJobs.push(...jobs);
    }

    const dedupedJobs = allJobs.filter((job, index, arr) => {
      if (!job.job_id) return true;
      return arr.findIndex((candidate) => candidate.job_id === job.job_id) === index;
    });

    return NextResponse.json(
      {
        ...(firstPayload ?? {}),
        data: dedupedJobs,
        meta: {
          aggregatedPages: maxPages,
          startPage: page,
          totalResults: dedupedJobs.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("jobs API proxy failed", error);
    return NextResponse.json(
      { error: "Unexpected error while fetching jobs" },
      { status: 500 },
    );
  }
}
