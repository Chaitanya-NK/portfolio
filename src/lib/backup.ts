export const CORE_TABLES = [
  "profile", "sections", "section_items", "tools", "skills", "experiences", "education",
  "achievements", "projects", "services", "testimonials", "posts", "notes", "reply_templates",
] as const;
export const MESSAGE_TABLES = ["messages", "message_replies"] as const;
export const ALL_TABLES: string[] = [...CORE_TABLES, ...MESSAGE_TABLES];

export const TABLE_LABEL: Record<string, string> = {
  profile: "Profile", sections: "Sections", section_items: "Custom section items", tools: "Tools",
  skills: "Skills", experiences: "Experience", education: "Education", achievements: "Achievements",
  projects: "Projects", services: "Services", testimonials: "Testimonials", posts: "Blog posts",
  notes: "Notes", reply_templates: "Reply templates", messages: "Inbox messages", message_replies: "Your replies",
};

export type Backup = {
  version: 1;
  app: "portfolio";
  exported_at: string;
  source_url: string;
  tables: Record<string, Record<string, any>[]>;
};
