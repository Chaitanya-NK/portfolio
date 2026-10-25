import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getSiteData } from "@/lib/site/data";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this website does and does not collect.",
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 leading-relaxed text-[color:var(--fg2)]">{children}</div>
    </section>
  );
}

export default async function PrivacyPage() {
  const { profile: p } = await getSiteData();
  const updated = p.updated_at ? format(new Date(p.updated_at), "d MMMM yyyy") : null;
  return (
    <main className="mx-auto w-[min(92%,44rem)] py-12 sm:py-20">
      <Link href="/" className="text-sm text-[color:var(--muted)] hover:text-[color:var(--fg)]">← {p.full_name || "Back to portfolio"}</Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">Privacy</h1>
      <p className="mt-3 text-[color:var(--muted)]">A plain-language summary of what this website does with your data. In short: very little, and no cookies.</p>

      <Block title="Visit statistics">
        <p>To see which pages are read, the site records each page view: the page address, the website you came from (domain only), your country, your device type (desktop, mobile or tablet) and your browser name.</p>
        <p>Visitors are counted using an anonymous code that is scrambled from your connection details and changes every day. Your IP address is never stored, nothing is saved in your browser for this, and there are no advertising or third-party trackers. If your browser sends a “Do Not Track” signal, it is respected.</p>
      </Block>
      <Block title="Who is here right now">
        <p>While a page is open and visible, it sends a short signal about every 45 seconds, using the same anonymous daily code, so I can see how many people are on the site at this moment. These signals are regularly cleared and are not kept as history.</p>
      </Block>
      <Block title="Intro video (when shown)">
        <p>Nothing is loaded from YouTube, Vimeo or Loom until you press “Watch intro”. After that, the video player loads from that service and its own privacy rules apply.</p>
      </Block>
      <Block title="AI assistant (when shown)">
        <p>If the “Ask AI” chat is visible, the question you type is sent to Google’s Gemini service, which writes an answer from this site’s public content. This website does not store your questions. Please don’t enter personal or sensitive information. Google may use content sent through its free service to improve its products.</p>
      </Block>
      <Block title="Link clicks">
        <p>Clicks on key buttons, such as the resume download, project links and social links, are counted anonymously so I can see what is useful.</p>
      </Block>
      <Block title="Contact form">
        <p>If you send a message, I store your name, email address and message, plus any topic or file you choose to add, so I can reply. I only use them to answer you and do not share them. Ask me and I will delete your message.</p>
        <p>To stop spam, the site keeps a scrambled (hashed) form of your connection details for a short time to limit how often the form can be used.</p>
      </Block>
      <Block title="Things stored in your browser">
        <p>Only your preferences: light or dark mode, and whether you dismissed an announcement. These stay on your device and are never sent to me.</p>
      </Block>
      <Block title="Services that run this site">
        <p>The site is hosted on Vercel. Content and messages are stored with Supabase. Emails are delivered through an email provider. They process data only to run the site.</p>
        <p>The contact form is protected by Cloudflare Turnstile, which checks that you are a person without puzzles or advertising cookies.</p>
      </Block>
      <Block title="Questions or deletion requests">
        <p>
          {p.email ? <>Email me at <a className="underline underline-offset-4" href={`mailto:${p.email}`}>{p.email}</a>.</> : <>Use the contact form on the home page.</>}
          {updated && <> Last updated {updated}.</>}
        </p>
      </Block>
    </main>
  );
}
