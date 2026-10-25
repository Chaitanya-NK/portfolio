// Saves a content backup (same format as the admin download) to backup/portfolio-YYYY-MM-DD.json
import { mkdirSync, writeFileSync } from "node:fs";

const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const headers = { apikey: key, authorization: `Bearer ${key}` };
const TABLES = ["profile", "sections", "section_items", "tools", "skills", "experiences", "education",
  "achievements", "projects", "services", "testimonials", "posts", "notes", "reply_templates"];

const tables = {};
for (const t of TABLES) {
  const rows = [];
  for (let from = 0; from < 20000; from += 1000) {
    const res = await fetch(`${url}/rest/v1/${t}?select=*&order=id.asc`, {
      headers: { ...headers, "Range-Unit": "items", Range: `${from}-${from + 999}` },
    });
    if (res.status === 416) break;
    if (!res.ok) { console.error(`${t}: ${res.status} ${await res.text()}`); process.exit(1); }
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  tables[t] = rows.map(({ fts, ...r }) => r);
  console.log(`${t}: ${rows.length}`);
}

const backup = { version: 1, app: "portfolio", exported_at: new Date().toISOString(), source_url: url, tables };
mkdirSync("backup", { recursive: true });
const file = `backup/portfolio-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(file, JSON.stringify(backup));
console.log(`Saved ${file}`);

// record it so the admin knows a backup happened
const counts = Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length]));
await fetch(`${url}/rest/v1/audit_logs`, {
  method: "POST",
  headers: { ...headers, "content-type": "application/json", Prefer: "return=minimal" },
  body: JSON.stringify({ action: "backup", entity: "backup", meta: { label: "automatic", counts } }),
});
