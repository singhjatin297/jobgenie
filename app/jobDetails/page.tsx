"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type ApplyOption = {
  publisher?: string;
  apply_link?: string;
  is_direct?: boolean;
};

type EmployerReview = {
  publisher?: string;
  employer_name?: string;
  score?: number;
  num_stars?: number;
  review_count?: number;
  max_score?: number;
  reviews_link?: string;
};

type JobDetails = {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  employer_logo?: string | null;
  employer_website?: string | null;
  job_publisher?: string | null;
  job_employment_type?: string | null;
  job_apply_link?: string | null;
  job_apply_is_direct?: boolean | null;
  apply_options?: ApplyOption[];
  job_description?: string | null;
  job_posted_at?: string | null;
  job_posted_at_datetime_utc?: string | null;
  job_location?: string | null;
  job_state?: string | null;
  job_country?: string | null;
  job_salary?: string | null;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_period?: string | null;
  job_is_remote?: boolean | null;
  employer_reviews?: EmployerReview[];
};

type JobDetailsResponse = {
  status?: string;
  data?: JobDetails[];
  error?: string;
};

const cleanDescription = (raw?: string | null) => {
  if (!raw) return "No job description provided.";
  return raw
    .replaceAll("â€™", "'")
    .replaceAll("â€œ", '"')
    .replaceAll("â€", '"')
    .replaceAll("â€”", "-")
    .replaceAll("Â·", "*")
    .replaceAll("\r\n", "\n");
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "Unknown";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatSalary = (details?: JobDetails) => {
  if (!details) return "Not disclosed";
  if (details.job_salary) return details.job_salary;

  if (
    typeof details.job_min_salary === "number" &&
    typeof details.job_max_salary === "number"
  ) {
    return `${details.job_min_salary} - ${details.job_max_salary} ${details.job_salary_period ?? ""}`.trim();
  }

  return "Not disclosed";
};

const getWorkMode = (isRemote?: boolean | null) => {
  if (isRemote === null || typeof isRemote === "undefined")
    return "Not specified";
  return isRemote ? "Remote" : "On-site";
};

const splitDescription = (text: string) =>
  text
    .split("\n\n")
    .map((part) => part.trim())
    .filter(Boolean);

const cardClass =
  "rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]";

const JobDetailsPage = () => {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");
  const country = searchParams.get("country") ?? "in";

  const [payload, setPayload] = useState<JobDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(jobId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setPayload(null);
      setIsLoading(false);
      return;
    }

    const fetchJobDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          job_id: jobId,
          country,
          language: "en",
        });
        const res = await fetch(`/api/job-details?${params.toString()}`);
        const json = (await res.json()) as JobDetailsResponse;

        if (!res.ok) {
          throw new Error(json.error ?? "Failed to load job details");
        }

        setPayload(json);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load job details";
        setError(message);
        setPayload(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchJobDetails();
  }, [country, jobId]);

  const job = payload?.data?.[0];

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Loading job details...
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          No job details found.
        </div>
      </main>
    );
  }

  const description = cleanDescription(job.job_description);
  const descriptionBlocks = splitDescription(description);
  const location = [job.job_state, job.job_country].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-[radial-gradient(820px_440px_at_8%_-8%,#fee2e2_0%,transparent_60%),radial-gradient(760px_440px_at_95%_0%,#dbeafe_0%,transparent_60%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:px-8 sm:py-7">
          <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-rose-100 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-sky-100 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Job Details
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-4xl">
                {job.job_title ?? "Untitled role"}
              </h1>
              <p className="text-sm text-slate-600 sm:text-base">
                {job.employer_name ?? "Unknown company"} -{" "}
                {job.job_location ?? "Location unavailable"}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  {job.job_employment_type ?? "Not specified"}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  {getWorkMode(job.job_is_remote)}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Posted {job.job_posted_at ?? "Unknown"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {job.job_apply_link && (
                <Button asChild size="lg" className="px-6">
                  <a
                    href={job.job_apply_link}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Open Application
                  </a>
                </Button>
              )}
              {job.employer_website && (
                <Button asChild variant="outline" size="lg">
                  <a
                    href={job.employer_website}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Company Site
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Salary", value: formatSalary(job) },
              { label: "Location", value: job.job_location ?? "Unknown" },
              { label: "Region", value: location || "Unknown" },
              {
                label: "Posted UTC",
                value: formatDate(job.job_posted_at_datetime_utc),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <article className={cardClass}>
            <h2 className="text-xl font-semibold text-slate-900">
              Job Description
            </h2>
            {error && (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {error}
              </p>
            )}
            <div className="mt-5 space-y-4">
              {descriptionBlocks.map((block, index) => (
                <p
                  key={`${block.slice(0, 24)}-${index}`}
                  className="text-sm leading-7 text-slate-700"
                >
                  {block}
                </p>
              ))}
            </div>
          </article>

          <aside className="space-y-6">
            <div className={cardClass}>
              <h3 className="text-lg font-semibold text-slate-900">
                Application Channels
              </h3>
              <div className="mt-4 space-y-3">
                {(job.apply_options ?? []).map((option, index) => (
                  <a
                    key={`${option.publisher ?? "option"}-${index}`}
                    href={option.apply_link ?? "#"}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-400"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {option.publisher ?? "Apply source"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {option.is_direct ? "Direct apply" : "External apply"}
                    </p>
                  </a>
                ))}
                {(job.apply_options ?? []).length === 0 && (
                  <p className="text-sm text-slate-600">
                    No alternate apply channels listed.
                  </p>
                )}
              </div>
            </div>

            <div className={cardClass}>
              <h3 className="text-lg font-semibold text-slate-900">
                Employer Reviews
              </h3>
              <div className="mt-4 space-y-3">
                {(job.employer_reviews ?? []).map((review, index) => (
                  <a
                    key={`${review.publisher ?? "review"}-${index}`}
                    href={review.reviews_link ?? "#"}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-400"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {review.publisher ?? "Review source"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {review.score ?? 0}/{review.max_score ?? 5} -{" "}
                      {review.review_count ?? 0} reviews
                    </p>
                  </a>
                ))}
                {(job.employer_reviews ?? []).length === 0 && (
                  <p className="text-sm text-slate-600">
                    No reviews available.
                  </p>
                )}
              </div>
            </div>

            <div className={cardClass}>
              <h3 className="text-lg font-semibold text-slate-900">Snapshot</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-700">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  Publisher: {job.job_publisher ?? "Unknown"}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  Job ID: {job.job_id ?? "Unknown"}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  Country: {job.job_country ?? "Unknown"}
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default JobDetailsPage;
