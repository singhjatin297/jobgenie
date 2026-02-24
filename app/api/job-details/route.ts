import { NextResponse } from "next/server";

const API_HOST = "jsearch.p.rapidapi.com";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");
  const country = searchParams.get("country") ?? "in";
  const language = searchParams.get("language") ?? "en";

  if (!jobId) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  const apiKey = process.env.RAPID_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "RapidAPI key is not configured" },
      { status: 500 },
    );
  }

  try {
    const params = new URLSearchParams({
      job_id: jobId,
      country,
      language,
    });

    const response = await fetch(
      `https://${API_HOST}/job-details?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": API_HOST,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch job details", details: text },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("job-details API proxy failed", error);
    return NextResponse.json(
      { error: "Unexpected error while fetching job details" },
      { status: 500 },
    );
  }
}
