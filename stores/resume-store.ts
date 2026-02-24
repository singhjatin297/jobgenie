import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type WorkHistory = {
  company: string;
  description: string;
  duration: string;
  role: string;
};

type Education = {
  degree: string;
  graduationYear: number;
  institution: string;
};

type Project = {
  name: string;
  description: string;
};

type ParsedData = {
  name: string;
  email: string;
  phone: string;
  education: Education[];
  yearsOfExperience: number;
  skills: string[];
  projects: Project[];
  workHistory: WorkHistory[];
  currentTitle: string;
  preferredLocations: string[];
  willingToRelocate: boolean;
  noticePeriodDays: number;
};

interface ResumeObject {
  message: string;
  success: boolean;
  originalName: string;
  parsedData: ParsedData;
}

interface ResumeStore {
  resumeObject: ResumeObject | null;
  updateResumeData: (data: ResumeObject) => void;
  clearResume: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resumeObject: null,
      updateResumeData: (data: ResumeObject) => {
        set(() => ({
          resumeObject: data,
        }));
      },
      clearResume: () => {
        set(() => ({
          resumeObject: null,
        }));
      },
    }),
    { name: "resume-storage", storage: createJSONStorage(() => localStorage) }
  )
);
