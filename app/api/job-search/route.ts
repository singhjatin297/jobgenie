import { NextResponse } from "next/server";

const API_HOST = "jsearch.p.rapidapi.com";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawPage = searchParams.get("page");
  const query = searchParams.get("query");
  const country = searchParams.get("country") ?? "in";
  const page = rawPage && !isNaN(Number(rawPage)) ? rawPage : "1";

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
    const params = new URLSearchParams({
      query,
      country,
      page,
    });

    const response = await fetch(
      `https://${API_HOST}/search?${params.toString()}`,
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
        { error: "Failed to fetch jobs", details: text },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("jobs API proxy failed", error);
    return NextResponse.json(
      { error: "Unexpected error while fetching jobs" },
      { status: 500 },
    );
  }
}
