// what the contact form offers, and which inbox label each topic gets automatically
export const TOPICS: Record<string, { label: string; tag: string }> = {
  general: { label: "General question", tag: "Question" },
  hiring: { label: "Hiring / job opportunity", tag: "Hiring" },
  freelance: { label: "Freelance project", tag: "Freelance" },
  collab: { label: "Collaboration", tag: "Collaboration" },
  other: { label: "Something else", tag: "" },
};
