"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResumeStore } from "@/stores/resume-store";

const datePostedOptions = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "3days", label: "Last 3 days" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
];

const employmentTypeOptions = [
  "FULLTIME",
  "CONTRACTOR",
  "PARTTIME",
  "INTERN",
] as const;

const jobRequirementOptions = [
  "under_3_years_experience",
  "more_than_3_years_experience",
  "no_experience",
  "no_degree",
] as const;

type Job = {
  id: string;
  role: string;
  company: string;
  location: string;
  country: string;
  employmentType: (typeof employmentTypeOptions)[number] | "";
  workFromHome: boolean;
  postedDaysAgo: number;
  highlight: string;
  applyUrl: string;
};

type JSearchResponse = {
  data?: Array<{
    job_id?: string;
    job_title?: string;
    employer_name?: string;
    job_location?: string;
    job_country?: string;
    job_employment_types?: string[];
    job_is_remote?: boolean;
    job_posted_at?: string | null;
    job_apply_link?: string;
  }>;
};

const parsePostedDays = (postedAt?: string | null) => {
  if (!postedAt) return 999;
  const lower = postedAt.toLowerCase();
  if (lower.includes("today")) return 0;
  const dayMatch = lower.match(/(\d+)\s*day/);
  if (dayMatch) return Number(dayMatch[1]);
  const weekMatch = lower.match(/(\d+)\s*week/);
  if (weekMatch) return Number(weekMatch[1]) * 7;
  const monthMatch = lower.match(/(\d+)\s*month/);
  if (monthMatch) return Number(monthMatch[1]) * 30;
  return 999;
};

const mapJSearchJobs = (payload: JSearchResponse | null): Job[] => {
  if (!payload?.data?.length) return [];

  return payload.data.map((job, index) => {
    const employmentType =
      (job.job_employment_types?.[0] as Job["employmentType"]) ?? "";

    return {
      id: job.job_id ?? `job-${index}`,
      role: job.job_title ?? "Untitled role",
      company: job.employer_name ?? "Unknown company",
      location: job.job_location ?? "Location unavailable",
      country: job.job_country?.toUpperCase() ?? "",
      employmentType,
      workFromHome: Boolean(job.job_is_remote),
      postedDaysAgo: parsePostedDays(job.job_posted_at ?? null),
      highlight: "Open role matched to your resume.",
      applyUrl: job.job_apply_link ?? "",
    };
  });
};

const JobsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearResume = useResumeStore((state) => state.clearResume);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [country, setCountry] = useState(
    (searchParams.get("country") ?? "").toUpperCase(),
  );
  const [datePosted, setDatePosted] = useState(
    searchParams.get("date_posted") ?? "month",
  );
  const [workFromHome, setWorkFromHome] = useState(
    searchParams.get("work_from_home") ?? "",
  );
  const [employmentTypes, setEmploymentTypes] = useState<string[]>(
    (searchParams.get("employment_types") ?? "").split(",").filter(Boolean),
  );
  const [jobRequirements, setJobRequirements] = useState<string[]>(
    (searchParams.get("job_requirements") ?? "").split(",").filter(Boolean),
  );

  useEffect(() => {
    clearResume();
  }, [clearResume]);

  useEffect(() => {
    const raw = localStorage.getItem("jSearchResponse");
    if (!raw) {
      setJobs([]);
      return;
    }
    try {
      const payload = JSON.parse(raw) as JSearchResponse;
      setJobs(mapJSearchJobs(payload));
    } catch {
      setJobs([]);
    }
  }, []);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    if (country.trim()) params.set("country", country.trim().toUpperCase());
    if (datePosted) params.set("date_posted", datePosted);
    if (workFromHome) params.set("work_from_home", workFromHome);
    if (employmentTypes.length > 0)
      params.set("employment_types", employmentTypes.join(","));
    if (jobRequirements.length > 0)
      params.set("job_requirements", jobRequirements.join(","));

    const next = params.toString();
    router.replace(next ? `/jobs?${next}` : "/jobs");
  };

  const clearFilters = () => {
    setQuery("");
    setCountry("");
    setDatePosted("month");
    setWorkFromHome("");
    setEmploymentTypes([]);
    setJobRequirements([]);
    router.replace("/jobs");
  };

  const handleApply = (job: Job) => {
    const params = new URLSearchParams({
      job_id: job.id,
      country: (job.country || "IN").toLowerCase(),
    });
    router.push(`/jobDetails?${params.toString()}`);
  };

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesDate = (job: Job) => {
      if (datePosted === "all") return true;
      if (datePosted === "today") return job.postedDaysAgo <= 0;
      if (datePosted === "3days") return job.postedDaysAgo <= 3;
      if (datePosted === "week") return job.postedDaysAgo <= 7;
      return job.postedDaysAgo <= 30;
    };

    return jobs.filter((job) => {
      const queryMatch = normalizedQuery
        ? `${job.role} ${job.location}`.toLowerCase().includes(normalizedQuery)
        : true;
      const countryMatch = country.trim()
        ? job.country === country.trim().toUpperCase()
        : true;
      const wfhMatch = workFromHome
        ? String(job.workFromHome) === workFromHome
        : true;
      const employmentMatch = employmentTypes.length
        ? employmentTypes.includes(job.employmentType)
        : true;
      return (
        queryMatch &&
        countryMatch &&
        wfhMatch &&
        employmentMatch &&
        matchesDate(job)
      );
    });
  }, [country, datePosted, employmentTypes, jobs, query, workFromHome]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_600px_at_15%_-10%,#FFE3D4_0%,transparent_55%),radial-gradient(900px_500px_at_100%_0%,#E0F2FE_0%,transparent_50%),linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-24 h-44 w-44 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute right-12 top-12 h-52 w-52 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-12 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-foreground/10 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70 shadow-sm backdrop-blur">
            Jobs Feed
          </span>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Roles matched to your resume
          </h1>
          <p className="max-w-2xl text-sm text-foreground/70 sm:text-base">
            Adjust filters to fine-tune the job feed before exporting or
            applying.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-2xl border border-foreground/10 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Filter roles
                </h2>
                <p className="text-sm text-foreground/60">
                  Refine the search input and location.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear
              </Button>
            </div>

            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="query">Query</Label>
                <Input
                  id="query"
                  placeholder="Role, skill, or location"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country ISO</Label>
                <Input
                  id="country"
                  placeholder="DE, IN, US"
                  value={country}
                  onChange={(event) =>
                    setCountry(event.target.value.toUpperCase())
                  }
                />
                <p className="text-xs text-foreground/60">
                  Use ISO-2 country codes (example: Berlin -`&gt;` DE).
                </p>
              </div>

              <div className="space-y-2">
                <Label>Date posted</Label>
                <Select value={datePosted} onValueChange={setDatePosted}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {datePostedOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Work from home</Label>
                <Select value={workFromHome} onValueChange={setWorkFromHome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Remote only</SelectItem>
                    <SelectItem value="false">On-site only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Employment types</Label>
                <div className="grid gap-2">
                  {employmentTypeOptions.map((option) => {
                    const checked = employmentTypes.includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 text-sm text-foreground/80"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            const nextChecked = Boolean(value);
                            setEmploymentTypes((prev) =>
                              nextChecked
                                ? [...prev, option]
                                : prev.filter((item) => item !== option),
                            );
                          }}
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Job requirements</Label>
                <div className="grid gap-2">
                  {jobRequirementOptions.map((option) => {
                    const checked = jobRequirements.includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 text-sm text-foreground/80"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            const nextChecked = Boolean(value);
                            setJobRequirements((prev) =>
                              nextChecked
                                ? [...prev, option]
                                : prev.filter((item) => item !== option),
                            );
                          }}
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-foreground/60">
                  Sent as a comma-delimited list.
                </p>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={applyFilters}
              >
                Apply filters
              </Button>
            </div>
          </aside>

          <main className="space-y-5">
            <div className="rounded-2xl border border-foreground/10 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Suggested roles
                  </h2>
                  <p className="text-sm text-foreground/60">
                    {filteredJobs.length} matches based on your filters.
                  </p>
                </div>
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/50">
                  Updated today
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredJobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-2xl border border-foreground/10 bg-white/80 p-6 shadow-sm backdrop-blur"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {job.role}
                      </h3>
                      <p className="text-sm text-foreground/60">
                        {job.company} - {job.location}
                      </p>
                    </div>
                    {job.employmentType && (
                      <span className="rounded-full border border-foreground/10 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
                        {job.employmentType}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-foreground/70">
                    {job.highlight}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                    <span className="rounded-full border border-foreground/10 bg-white/70 px-3 py-1">
                      {job.workFromHome ? "Remote" : "On-site"}
                    </span>
                    <span className="rounded-full border border-foreground/10 bg-white/70 px-3 py-1">
                      Posted {job.postedDaysAgo} day
                      {job.postedDaysAgo === 1 ? "" : "s"} ago
                    </span>
                    <span className="rounded-full border border-foreground/10 bg-white/70 px-3 py-1">
                      Country {job.country}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleApply(job)}
                      className="ml-auto"
                    >
                      Apply
                    </Button>
                  </div>
                </article>
              ))}

              {filteredJobs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-foreground/20 bg-white/70 p-8 text-center text-sm text-foreground/60">
                  No roles match these filters yet. Try widening your search.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
