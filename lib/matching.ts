export type CandidateResume = {
  currentTitle?: string;
  yearsOfExperience?: number;
  skills?: string[];
  preferredLocations?: string[];
  workHistory?: Array<{
    company?: string;
    role?: string;
    description?: string;
    duration?: string;
  }>;
  projects?: Array<{
    name?: string;
    title?: string;
    description?: string;
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    graduationYear?: number;
  }>;
};

export type SearchJob = {
  id?: string;
  role?: string;
  company?: string;
  location?: string;
  country?: string;
  employmentType?: string;
  workFromHome?: boolean;
  postedDaysAgo?: number;
  applyUrl?: string;
  description?: string;
  requirements?: string;
};

const COMMON_SKILLS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "react",
  "next.js",
  "node.js",
  "express",
  "sql",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "graphql",
  "rest",
  "html",
  "css",
  "tailwind",
  "jest",
  "cypress",
  "playwright",
  "git",
  "linux",
  "machine learning",
  "pytorch",
  "tensorflow",
];

export const normalizeText = (value: string) =>
  value.toLowerCase().replace(/[^\w\s.+#-]/g, " ").replace(/\s+/g, " ").trim();

export const tokenize = (value: string) => {
  const normalized = normalizeText(value);
  if (!normalized) return [] as string[];
  return normalized.split(" ").filter((token) => token.length > 1);
};

const vectorFromTokens = (tokens: string[]) => {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
};

const norm = (counts: Map<string, number>) => {
  let total = 0;
  for (const value of counts.values()) total += value * value;
  return Math.sqrt(total);
};

export const cosineFromText = (left: string, right: string) => {
  const leftVector = vectorFromTokens(tokenize(left));
  const rightVector = vectorFromTokens(tokenize(right));

  const leftNorm = norm(leftVector);
  const rightNorm = norm(rightVector);
  if (leftNorm === 0 || rightNorm === 0) return 0;

  let dot = 0;
  for (const [token, value] of leftVector) {
    dot += value * (rightVector.get(token) ?? 0);
  }
  return dot / (leftNorm * rightNorm);
};

export const cosineFromEmbeddings = (left: number[], right: number[]) => {
  if (!left.length || !right.length || left.length !== right.length) return 0;

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (!leftNorm || !rightNorm) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
};

export const toPercent = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value * 100)));

export const buildCandidateProfileText = (candidate: CandidateResume) => {
  const skills = (candidate.skills ?? []).slice(0, 20).join(", ");
  const work = (candidate.workHistory ?? [])
    .slice(0, 4)
    .map(
      (item) =>
        `${item.role ?? ""} at ${item.company ?? ""}: ${item.description ?? ""}`,
    )
    .join("\n");
  const projects = (candidate.projects ?? [])
    .slice(0, 4)
    .map((item) => `${item.name ?? item.title ?? "Project"}: ${item.description ?? ""}`)
    .join("\n");
  const locations = (candidate.preferredLocations ?? []).join(", ");

  return `
Role: ${candidate.currentTitle ?? ""}
Years of experience: ${candidate.yearsOfExperience ?? 0}
Skills: ${skills}
Preferred locations: ${locations}
Work highlights:
${work}
Projects:
${projects}
  `.trim();
};

export const buildJobText = (job: SearchJob) =>
  `
Role: ${job.role ?? ""}
Company: ${job.company ?? ""}
Location: ${job.location ?? ""}
Description: ${job.description ?? ""}
Requirements: ${job.requirements ?? ""}
Employment type: ${job.employmentType ?? ""}
  `.trim();

export const extractSkillsFromText = (text: string, candidateSkills: string[]) => {
  const normalized = normalizeText(text);
  const candidate = candidateSkills
    .map((skill) => skill.trim())
    .filter(Boolean)
    .map((skill) => skill.toLowerCase());
  const vocabulary = [...new Set([...candidate, ...COMMON_SKILLS])];

  return vocabulary.filter((skill) => normalized.includes(skill.toLowerCase()));
};

export const extractYearsRequirement = (text: string) => {
  const normalized = normalizeText(text);
  const ranges = [
    /(\d+)\s*-\s*(\d+)\s*(?:\+?\s*)?(?:years?|yrs?)/,
    /(\d+)\s*(?:\+|plus)?\s*(?:years?|yrs?)/,
  ];

  for (const pattern of ranges) {
    const match = normalized.match(pattern);
    if (!match) continue;
    if (match.length >= 3 && match[2]) return Number(match[1]);
    return Number(match[1]);
  }

  return null;
};

export const fitBreakdown = (candidate: CandidateResume, jobText: string) => {
  const candidateSkills = candidate.skills ?? [];
  const requiredSkills = extractSkillsFromText(jobText, candidateSkills);
  const matchedSkills = requiredSkills.filter((skill) =>
    candidateSkills.some((candidateSkill) => candidateSkill.toLowerCase() === skill),
  );
  const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));

  const neededYears = extractYearsRequirement(jobText);
  const candidateYears = candidate.yearsOfExperience ?? 0;
  const seniorityMismatch =
    neededYears !== null && candidateYears < neededYears
      ? `${neededYears}+ years requested, profile has ${candidateYears}`
      : null;

  return {
    matchedSkills: matchedSkills.slice(0, 8),
    missingSkills: missingSkills.slice(0, 8),
    seniorityMismatch,
  };
};

export const buildEvidencePack = (candidate: CandidateResume) => {
  const workBullets = (candidate.workHistory ?? []).map((item) =>
    `${item.role ?? "Role"} at ${item.company ?? "Company"} (${item.duration ?? "Duration"}): ${item.description ?? ""}`,
  );
  const projectBullets = (candidate.projects ?? []).map(
    (item) => `${item.name ?? item.title ?? "Project"}: ${item.description ?? ""}`,
  );
  const education = (candidate.education ?? []).map(
    (item) =>
      `${item.degree ?? "Degree"} - ${item.institution ?? "Institution"} (${item.graduationYear ?? "Year"})`,
  );

  return {
    currentTitle: candidate.currentTitle ?? "",
    yearsOfExperience: candidate.yearsOfExperience ?? 0,
    skills: candidate.skills ?? [],
    workBullets,
    projectBullets,
    education,
    preferredLocations: candidate.preferredLocations ?? [],
  };
};
