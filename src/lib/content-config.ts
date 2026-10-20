export type FieldType =
  | "text" | "textarea" | "number" | "date" | "datetime"
  | "image" | "tags" | "lines" | "switch" | "select" | "metrics";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  numeric?: boolean;
  default?: string;
  folder?: string;
  help?: string;
};

export type EntityConfig = {
  table: string;
  title: string;
  singular: string;
  primary: string;
  secondary?: string[];
  fields: Field[];
};

const published: Field = { key: "published", label: "Published (visible on site)", type: "switch" };

export const CONTENT: Record<string, EntityConfig> = {
  tools: {
    table: "tools", title: "Tools", singular: "tool", primary: "name", secondary: ["category"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Next.js" },
      { key: "category", label: "Category", type: "text", placeholder: "e.g. Frontend" },
      { key: "icon_url", label: "Icon (optional)", type: "image", folder: "tools" },
      published,
    ],
  },
  skills: {
    table: "skills", title: "Skills", singular: "skill", primary: "name", secondary: ["category"],
    fields: [
      { key: "category", label: "Category", type: "text", required: true, placeholder: "e.g. Frontend" },
      { key: "name", label: "Skill", type: "text", required: true, placeholder: "e.g. React" },
      { key: "level", label: "Level (1 to 5)", type: "select", options: ["1", "2", "3", "4", "5"], numeric: true, default: "3" },
      published,
    ],
  },
  experience: {
    table: "experiences", title: "Experience", singular: "role", primary: "role", secondary: ["company"],
    fields: [
      { key: "role", label: "Role", type: "text", required: true },
      { key: "company", label: "Company", type: "text", required: true },
      { key: "logo_url", label: "Company logo", type: "image", folder: "companies" },
      { key: "start_date", label: "Start date", type: "date" },
      { key: "end_date", label: "End date", type: "date" },
      { key: "is_current", label: "I currently work here", type: "switch" },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "bullets", label: "Impact bullets (one per line)", type: "lines" },
      { key: "tech", label: "Tech used (comma separated)", type: "tags" },
      published,
    ],
  },
  education: {
    table: "education", title: "Education", singular: "entry", primary: "degree", secondary: ["institution"],
    fields: [
      { key: "degree", label: "Degree / course", type: "text", required: true },
      { key: "institution", label: "Institution", type: "text", required: true },
      { key: "start_year", label: "Start year", type: "number" },
      { key: "end_year", label: "End year", type: "number" },
      { key: "grade", label: "Grade / notes", type: "text" },
      published,
    ],
  },
  achievements: {
    table: "achievements", title: "Achievements", singular: "achievement", primary: "title", secondary: ["issuer"],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "issuer", label: "Issuer / event", type: "text" },
      { key: "year", label: "Year", type: "number" },
      { key: "description", label: "Description", type: "textarea" },
      published,
    ],
  },
  projects: {
    table: "projects", title: "Projects", singular: "project", primary: "title", secondary: ["year"],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "summary", label: "One-line outcome", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "cover_url", label: "Cover image", type: "image", folder: "projects" },
      { key: "role", label: "Your role", type: "text" },
      { key: "year", label: "Year", type: "number" },
      { key: "tags", label: "Tech tags (comma separated)", type: "tags" },
      { key: "live_url", label: "Live URL", type: "text", placeholder: "https://..." },
      { key: "repo_url", label: "Code URL", type: "text", placeholder: "https://..." },
      { key: "metrics", label: "Result metrics", type: "metrics" },
      { key: "featured", label: "Featured (shown large)", type: "switch" },
      { key: "publish_at", label: "Schedule publishing (optional)", type: "datetime", help: "Leave empty to publish immediately when Published is on." },
      published,
    ],
  },
  testimonials: {
    table: "testimonials", title: "Testimonials", singular: "testimonial", primary: "name", secondary: ["company"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "title", label: "Job title", type: "text" },
      { key: "company", label: "Company", type: "text" },
      { key: "quote", label: "Quote", type: "textarea", required: true },
      { key: "avatar_url", label: "Photo", type: "image", folder: "testimonials" },
      published,
    ],
  },
};
