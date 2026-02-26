"use client";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { useResumeStore } from "@/stores/resume-store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { csSkills, indianPlaces } from "@/utils/option";

const educationSchema = z.object({
  degree: z.string(),
  graduationYear: z.number(),
  institution: z.string(),
});
const projectSchema = z.object({
  name: z.string(),
  description: z.string(),
});
const workHistorySchema = z.object({
  company: z.string(),
  description: z.string(),
  duration: z.string(),
  role: z.string(),
});

const resumeSchema = z.object({
  name: z.string(),
  email: z.email(),
  phone: z.string(),
  education: z.array(educationSchema),
  yearsOfExperience: z.coerce.number<number>().min(1).max(40),
  skills: z.array(z.string()),
  projects: z.array(projectSchema),
  workHistory: z.array(workHistorySchema),
  currentTitle: z.string(),
  noticePeriodDays: z.coerce.number<number>().min(1).max(40),
  willingToRelocate: z.boolean(),
  preferredLocations: z.array(z.string()),
});

type resumeType = z.infer<typeof resumeSchema>;

const EditResume = () => {
  const router = useRouter();
  const resumeObject = useResumeStore((state) => state.resumeObject);
  const hasHydrated = useResumeStore((state) => state.hasHydrated);
  const [skills, setSkills] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [relocateChoice, setRelocateChoice] = useState("no");

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!resumeObject) {
      router.push("/");
    }
  }, [hasHydrated, router, resumeObject]);

  const {
    handleSubmit,
    reset,
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<resumeType>({
    defaultValues: {
      name: resumeObject?.parsedData?.name,
      email: resumeObject?.parsedData?.email,
      phone: resumeObject?.parsedData?.phone,
      yearsOfExperience: resumeObject?.parsedData?.yearsOfExperience,
      skills: resumeObject?.parsedData?.skills ?? [],
      education: resumeObject?.parsedData.education ?? [],
      workHistory: resumeObject?.parsedData.workHistory ?? [],
      projects: resumeObject?.parsedData.projects ?? [],
      currentTitle: resumeObject?.parsedData?.currentTitle,
      noticePeriodDays: resumeObject?.parsedData?.noticePeriodDays,
      willingToRelocate: resumeObject?.parsedData?.willingToRelocate,
      preferredLocations: resumeObject?.parsedData?.preferredLocations ?? [],
    },
    resolver: zodResolver(resumeSchema),
  });

  useEffect(() => {
    const nextSkills = resumeObject?.parsedData?.skills ?? [];
    const nextLocations = resumeObject?.parsedData?.preferredLocations ?? [];
    const nextRelocate = resumeObject?.parsedData?.willingToRelocate
      ? "yes"
      : "no";

    reset({
      name: resumeObject?.parsedData?.name ?? "",
      email: resumeObject?.parsedData?.email ?? "",
      phone: resumeObject?.parsedData?.phone ?? "",
      yearsOfExperience: resumeObject?.parsedData?.yearsOfExperience ?? 0,
      skills: nextSkills,
      education: resumeObject?.parsedData.education ?? [],
      workHistory: resumeObject?.parsedData.workHistory ?? [],
      projects: resumeObject?.parsedData.projects ?? [],
      currentTitle: resumeObject?.parsedData?.currentTitle ?? "",
      noticePeriodDays: resumeObject?.parsedData?.noticePeriodDays ?? 0,
      willingToRelocate: resumeObject?.parsedData?.willingToRelocate ?? false,
      preferredLocations: nextLocations,
    });

    setSkills(nextSkills);
    setPreferredLocations(nextLocations);
    setRelocateChoice(nextRelocate);
  }, [resumeObject, reset]);

  const {
    fields: educationFields,
    append: educationAppend,
    remove: educationRemove,
  } = useFieldArray({
    control,
    name: "education",
  });

  const {
    fields: projectFields,
    append: projectAppend,
    remove: projectRemove,
  } = useFieldArray({
    control,
    name: "projects",
  });

  const {
    fields: workHistoryFields,
    append: workHistoryAppend,
    remove: workHistoryRemove,
  } = useFieldArray({
    control,
    name: "workHistory",
  });

  const onSubmit = async (data: resumeType) => {
    localStorage.setItem("Resume", JSON.stringify(data));

    try {
      const queryParts = [
        data.currentTitle,
        ...data.skills.slice(0, 3),
      ].filter(Boolean);
      const params = new URLSearchParams({
        query: queryParts.join(" "),
        country: "in",
        page: "1",
        max_pages: "5",
      });

      const res = await fetch(`/api/job-search?${params.toString()}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed");
      }

      const payload = await res.json();
      localStorage.setItem("jSearchResponse", JSON.stringify(payload));
      toast.success("Thanku ❤️");

      router.push("/jobs");
      reset();
    } catch (error) {
      console.error("Resume upload failed:", error);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_600px_at_0%_-10%,#FCE7F3_0%,transparent_55%),radial-gradient(900px_500px_at_100%_0%,#DBEAFE_0%,transparent_50%),linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-12 top-24 h-44 w-44 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute right-10 top-10 h-52 w-52 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-12 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-emerald-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-14">
        <header className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-foreground/10 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70 shadow-sm backdrop-blur">
            Resume Editor
          </span>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Review and refine your resume details
          </h1>
          <p className="max-w-2xl text-sm text-foreground/70 sm:text-base">
            We&apos;ve pre-filled the form from your PDF. Tweak sections, add
            missing details, and keep everything ATS-ready.
          </p>
        </header>

        <form
          id="resume-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-8"
        >
          <section className="rounded-2xl border border-foreground/10 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Contact details
                </h2>
                <p className="text-sm text-foreground/60">
                  Make sure recruiters can reach you fast.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  autoComplete="off"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  placeholder="jane@company.com"
                  autoComplete="off"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  autoComplete="off"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-foreground/10 bg-white/80 p-6 shadow-sm backdrop-blur">
              <h2 className="text-lg font-semibold text-foreground">
                Experience snapshot
              </h2>
              <p className="text-sm text-foreground/60">
                High-level context for recruiters and filters.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    placeholder="5"
                    autoComplete="off"
                    {...register("yearsOfExperience")}
                  />
                  {errors.yearsOfExperience && (
                    <p className="text-xs text-destructive">
                      {errors.yearsOfExperience.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentTitle">Current title</Label>
                  <Input
                    id="currentTitle"
                    placeholder="Senior Frontend Engineer"
                    autoComplete="off"
                    {...register("currentTitle")}
                  />
                  {errors.currentTitle && (
                    <p className="text-xs text-destructive">
                      {errors.currentTitle.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="noticePeriodDays">Notice period (days)</Label>
                  <Input
                    id="noticePeriodDays"
                    type="number"
                    placeholder="30"
                    autoComplete="off"
                    {...register("noticePeriodDays")}
                  />
                  {errors.noticePeriodDays && (
                    <p className="text-xs text-destructive">
                      {errors.noticePeriodDays.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-foreground/10 bg-white/80 p-6 shadow-sm backdrop-blur">
              <h2 className="text-lg font-semibold text-foreground">Skills</h2>
              <p className="text-sm text-foreground/60">
                Add the tech stack you want to be discovered for.
              </p>

              <div className="mt-5 space-y-3">
                <Combobox
                  items={csSkills}
                  multiple
                  value={skills}
                  onValueChange={(newValue) => {
                    setSkills(newValue);
                    setValue("skills", newValue);
                  }}
                >
                  <ComboboxChips>
                    <ComboboxValue>
                      {skills.map((item) => (
                        <ComboboxChip key={item}>{item}</ComboboxChip>
                      ))}
                    </ComboboxValue>
                    <ComboboxChipsInput placeholder="Add framework" />
                  </ComboboxChips>
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {errors.skills && (
                  <p className="text-xs text-destructive">
                    {errors.skills.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-foreground/10 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Education
                </h2>
                <p className="text-sm text-foreground/60">
                  Keep the most relevant or recent entries first.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  educationAppend({
                    degree: "",
                    institution: "",
                    graduationYear: new Date().getFullYear(),
                  })
                }
              >
                Add education
              </Button>
            </div>

            <div className="mt-6 grid gap-4">
              {educationFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-xl border border-foreground/10 bg-white/70 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-2">
                      <Label htmlFor={`education-${index}-degree`}>
                        Degree
                      </Label>
                      <Input
                        id={`education-${index}-degree`}
                        placeholder="B.Tech in Computer Science"
                        {...register(`education.${index}.degree`)}
                      />
                      {errors.education?.[index]?.degree && (
                        <p className="text-xs text-destructive">
                          {errors.education[index].degree.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`education-${index}-graduation`}>
                        Graduation year
                      </Label>
                      <Input
                        id={`education-${index}-graduation`}
                        type="number"
                        placeholder="2022"
                        {...register(`education.${index}.graduationYear`)}
                      />
                      {errors.education?.[index]?.graduationYear && (
                        <p className="text-xs text-destructive">
                          {errors.education[index].graduationYear.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="w-full space-y-2">
                      <Label htmlFor={`education-${index}-institution`}>
                        Institution
                      </Label>
                      <Input
                        id={`education-${index}-institution`}
                        placeholder="Indian Institute of Technology"
                        {...register(`education.${index}.institution`)}
                      />
                      {errors.education?.[index]?.institution && (
                        <p className="text-xs text-destructive">
                          {errors.education[index].institution.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => educationRemove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-foreground/10 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Projects
                  </h2>
                  <p className="text-sm text-foreground/60">
                    Highlight outcomes, impact, and stack.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => projectAppend({ name: "", description: "" })}
                >
                  Add project
                </Button>
              </div>

              <div className="mt-6 grid gap-4">
                {projectFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-xl border border-foreground/10 bg-white/70 p-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`projects-${index}-name`}>
                        Project name
                      </Label>
                      <Input
                        id={`projects-${index}-name`}
                        placeholder="Payments analytics dashboard"
                        {...register(`projects.${index}.name`)}
                      />
                      {errors.projects?.[index]?.name && (
                        <p className="text-xs text-destructive">
                          {errors.projects[index].name.message}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label htmlFor={`projects-${index}-description`}>
                        Description
                      </Label>
                      <Textarea
                        id={`projects-${index}-description`}
                        placeholder="Shipped a real-time dashboard that reduced chargeback resolution time by 35%."
                        rows={3}
                        {...register(`projects.${index}.description`)}
                      />
                      {errors.projects?.[index]?.description && (
                        <p className="text-xs text-destructive">
                          {errors.projects[index].description.message}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => projectRemove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-foreground/10 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Work history
                  </h2>
                  <p className="text-sm text-foreground/60">
                    Capture roles, impact, and responsibilities.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    workHistoryAppend({
                      company: "",
                      role: "",
                      duration: "",
                      description: "",
                    })
                  }
                >
                  Add role
                </Button>
              </div>

              <div className="mt-6 grid gap-4">
                {workHistoryFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-xl border border-foreground/10 bg-white/70 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`work-${index}-company`}>Company</Label>
                        <Input
                          id={`work-${index}-company`}
                          placeholder="Zapier"
                          {...register(`workHistory.${index}.company`)}
                        />
                        {errors.workHistory?.[index]?.company && (
                          <p className="text-xs text-destructive">
                            {errors.workHistory[index].company.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`work-${index}-role`}>Role</Label>
                        <Input
                          id={`work-${index}-role`}
                          placeholder="Product Designer"
                          {...register(`workHistory.${index}.role`)}
                        />
                        {errors.workHistory?.[index]?.role && (
                          <p className="text-xs text-destructive">
                            {errors.workHistory[index].role.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`work-${index}-duration`}>
                          Duration
                        </Label>
                        <Input
                          id={`work-${index}-duration`}
                          placeholder="Jan 2021 - Dec 2024"
                          {...register(`workHistory.${index}.duration`)}
                        />
                        {errors.workHistory?.[index]?.duration && (
                          <p className="text-xs text-destructive">
                            {errors.workHistory[index].duration.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label htmlFor={`work-${index}-description`}>
                        Description
                      </Label>
                      <Textarea
                        id={`work-${index}-description`}
                        placeholder="Led a cross-functional squad to deliver a new onboarding flow."
                        rows={3}
                        {...register(`workHistory.${index}.description`)}
                      />
                      {errors.workHistory?.[index]?.description && (
                        <p className="text-xs text-destructive">
                          {errors.workHistory[index].description.message}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => workHistoryRemove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-foreground/10 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold text-foreground">
              Preferences
            </h2>
            <p className="text-sm text-foreground/60">
              Control relocation and target locations.
            </p>

            <div className="mt-5 grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
              <div className="space-y-2">
                <Label>Willing to relocate?</Label>
                <Select
                  value={relocateChoice}
                  onValueChange={(value) => {
                    setRelocateChoice(value);
                    setValue("willingToRelocate", value === "yes");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Willing to relocate?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                {errors.willingToRelocate && (
                  <p className="text-xs text-destructive">
                    {errors.willingToRelocate.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Preferred locations</Label>
                <Combobox
                  items={indianPlaces}
                  multiple
                  value={preferredLocations}
                  onValueChange={(newValue) => {
                    setPreferredLocations(newValue);
                    setValue("preferredLocations", newValue);
                  }}
                >
                  <ComboboxChips>
                    <ComboboxValue>
                      {preferredLocations.map((item) => (
                        <ComboboxChip key={item}>{item}</ComboboxChip>
                      ))}
                    </ComboboxValue>
                    <ComboboxChipsInput placeholder="Add preferred location" />
                  </ComboboxChips>
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {errors.preferredLocations && (
                  <p className="text-xs text-destructive">
                    {errors.preferredLocations.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="text-sm text-foreground/60">
              All changes stay local to your workspace until you export.
            </div>
            <div className="flex flex-wrap items-center gap-2 md:flex-row">
              <Button type="submit" size="lg" aria-label="Submit">
                Save & continue
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditResume;
