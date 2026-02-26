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
  hasHydrated: boolean;
  updateResumeData: (data: ResumeObject) => void;
  clearResume: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resumeObject: null,
      hasHydrated: false,
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
      setHasHydrated: (value: boolean) => {
        set(() => ({
          hasHydrated: value,
        }));
      },
    }),
    {
      name: "resume-storage",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ResumeStore>;

        return {
          ...currentState,
          ...persisted,
          // Prevent late hydration from clobbering freshly uploaded in-memory data.
          resumeObject:
            currentState.resumeObject ?? persisted.resumeObject ?? null,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
