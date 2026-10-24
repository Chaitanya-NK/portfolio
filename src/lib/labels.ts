export const LABELS = ["Hiring", "Freelance", "Collaboration", "Question", "Spam"] as const;

export const LABEL_STYLE: Record<string, string> = {
  Hiring: "bg-emerald-100 text-emerald-800",
  Freelance: "bg-sky-100 text-sky-800",
  Collaboration: "bg-violet-100 text-violet-800",
  Question: "bg-amber-100 text-amber-800",
  Spam: "bg-red-100 text-red-800",
};
