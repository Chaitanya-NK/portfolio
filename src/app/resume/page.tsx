import type { Metadata } from "next";
import { getSiteData } from "@/lib/site/data";
import { defaultResume } from "@/lib/resume-version";
import { ResumeView } from "./resume-view";

export async function generateMetadata(): Promise<Metadata> {
  const { profile: p } = await getSiteData();
  return { title: `${p.full_name ?? "Resume"} - Resume` };
}

export default async function ResumePage() {
  return <ResumeView data={defaultResume(await getSiteData())} />;
}
