"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResumeStore } from "@/stores/resume-store";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const updateResumeData = useResumeStore((state) => state.updateResumeData);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/resume-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to upload resume");
      }

      const data = await res.json();
      updateResumeData(data);
      router.push("/editResume");
    } catch (error) {
      console.error("Resume upload failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_600px_at_10%_-10%,#FFE7C4_0%,transparent_55%),radial-gradient(900px_500px_at_100%_0%,#B8F3FF_0%,transparent_50%),linear-gradient(180deg,#FDF7F0_0%,#F7FAFF_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-32 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute right-16 top-12 h-52 w-52 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70 shadow-sm backdrop-blur">
              Resume Lab
            </span>

            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                Upload your resume. Get a clean, editable layout in minutes.
              </h1>
              <p className="text-base text-foreground/70 sm:text-lg">
                Drop a PDF and we extract the content into a modern editor with
                sharp sections, smart spacing, and export-ready formatting.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-foreground/10 bg-white/70 p-5 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-foreground">
                  Structured extraction
                </p>
                <p className="mt-2 text-sm text-foreground/70">
                  Keeps headings, roles, and dates aligned for quick edits.
                </p>
              </div>
              <div className="rounded-2xl border border-foreground/10 bg-white/70 p-5 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-foreground">
                  ATS-friendly export
                </p>
                <p className="mt-2 text-sm text-foreground/70">
                  Clean typography and spacing tuned for screening tools.
                </p>
              </div>
              <div className="rounded-2xl border border-foreground/10 bg-white/70 p-5 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-foreground">
                  Real-time editing
                </p>
                <p className="mt-2 text-sm text-foreground/70">
                  Tweak bullets, titles, and order without re-uploading.
                </p>
              </div>
              <div className="rounded-2xl border border-foreground/10 bg-white/70 p-5 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-foreground">
                  Private by design
                </p>
                <p className="mt-2 text-sm text-foreground/70">
                  Your document stays in your workspace, not in a template.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground/50">
              <span className="h-px w-12 bg-foreground/20" />
              Trusted by early career teams
            </div>
          </div>

          <div className="relative animate-in fade-in-0 slide-in-from-bottom-6 duration-700">
            <div className="absolute -inset-4 rounded-[32px] bg-white/50 blur-2xl" />
            <div className="relative rounded-[28px] border border-foreground/10 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground/60">
                  Step 1 of 3
                </p>
                <h2 className="text-2xl font-semibold text-foreground">
                  Upload your PDF resume
                </h2>
                <p className="text-sm text-foreground/70">
                  We&apos;ll parse the document and open it in the editor.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="resume">Resume file</Label>
                  <Input
                    id="resume"
                    type="file"
                    name="resume"
                    accept=".pdf"
                    required
                    onChange={(event) =>
                      setFileName(event.target.files?.[0]?.name ?? null)
                    }
                  />
                  <p className="text-xs text-foreground/60">
                    PDF only. We keep formatting intact and extract the text.
                  </p>
                </div>

                <div
                  className="rounded-xl border border-dashed border-foreground/20 bg-white/70 px-4 py-3 text-sm text-foreground/70"
                  aria-live="polite"
                >
                  {fileName ? `Selected: ${fileName}` : "No file selected yet."}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Uploading..." : "Upload & start editing"}
                </Button>
              </form>

              <div className="mt-6 grid gap-3 text-xs text-foreground/60">
                <div className="flex items-center justify-between rounded-lg border border-foreground/10 bg-white/70 px-3 py-2">
                  <span>Automatic section grouping</span>
                  <span className="font-semibold text-foreground/80">
                    1 min
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-foreground/10 bg-white/70 px-3 py-2">
                  <span>Editable layout preview</span>
                  <span className="font-semibold text-foreground/80">
                    2 min
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-foreground/10 bg-white/70 px-3 py-2">
                  <span>Export-ready resume</span>
                  <span className="font-semibold text-foreground/80">
                    5 min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
