"use client";
import { useActionState } from "react";
import { updateProfile, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/admin/file-upload";
import { StatsEditor, SocialsEditor } from "@/components/admin/list-editors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type P = Record<string, any>;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-sm font-medium">{label}{children}</label>;
}

export function ProfileForm({ p }: { p: P }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, null);
  return (
    <form action={action} className="grid max-w-none items-start gap-6 xl:grid-cols-2">
      <Card className="xl:col-span-2">
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input name="full_name" defaultValue={p.full_name ?? ""} /></Field>
          <Field label="Availability"><Input name="availability" defaultValue={p.availability ?? ""} /></Field>
          <div className="sm:col-span-2"><Field label="Headline"><Input name="headline" defaultValue={p.headline ?? ""} /></Field></div>
          <div className="sm:col-span-2"><Field label="Bio"><Textarea name="bio" rows={4} defaultValue={p.bio ?? ""} /></Field></div>
          <Field label="Email"><Input name="email" defaultValue={p.email ?? ""} /></Field>
          <Field label="Phone"><Input name="phone" defaultValue={p.phone ?? ""} /></Field>
          <Field label="Location"><Input name="location" defaultValue={p.location ?? ""} /></Field>
          <FileUpload name="resume_url" label="Resume (PDF, max 10 MB)" folder="resume" accept="application/pdf" maxMB={10} defaultValue={p.resume_url} />
          <FileUpload name="avatar_url" label="Profile photo (max 5 MB)" folder="profile" accept="image/*" defaultValue={p.avatar_url} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Stats and links</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-2 text-sm font-medium">
            Hero stats
            <StatsEditor name="stats" initial={p.stats ?? []} />
          </div>
          <div className="flex flex-col gap-2 text-sm font-medium">
            Social links
            <SocialsEditor
              name="socials"
              initial={(p.socials ?? []).map((x: any) => ({ platform: x.platform ?? x.label ?? "Other", url: (x.url ?? "").replace(/^mailto:/, "") }))}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Page title"><Input name="seo_title" defaultValue={p.seo?.title ?? ""} /></Field>
          <Field label="Meta description"><Textarea name="seo_description" rows={2} defaultValue={p.seo?.description ?? ""} /></Field>
        </CardContent>
      </Card>
      <div className="flex items-center gap-4 xl:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
        {state && <span className={`text-sm ${state.ok ? "text-green-600" : "text-red-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
