"use client";
import { useActionState } from "react";
import { updateProfile, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type P = Record<string, any>;
const pairs = (arr: any[] | null, a: string, b: string) =>
  (arr ?? []).map((x) => `${x[a]} | ${x[b]}`).join("\n");

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-sm font-medium">{label}{children}</label>;
}

export function ProfileForm({ p }: { p: P }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, null);
  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input name="full_name" defaultValue={p.full_name ?? ""} /></Field>
          <Field label="Availability"><Input name="availability" defaultValue={p.availability ?? ""} /></Field>
          <div className="sm:col-span-2"><Field label="Headline"><Input name="headline" defaultValue={p.headline ?? ""} /></Field></div>
          <div className="sm:col-span-2"><Field label="Bio"><Textarea name="bio" rows={4} defaultValue={p.bio ?? ""} /></Field></div>
          <Field label="Email"><Input name="email" defaultValue={p.email ?? ""} /></Field>
          <Field label="Phone"><Input name="phone" defaultValue={p.phone ?? ""} /></Field>
          <Field label="Location"><Input name="location" defaultValue={p.location ?? ""} /></Field>
          <Field label="Resume URL"><Input name="resume_url" defaultValue={p.resume_url ?? ""} /></Field>
          <div className="sm:col-span-2"><Field label="Photo URL (media library comes later)"><Input name="avatar_url" defaultValue={p.avatar_url ?? ""} /></Field></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Stats and links</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Hero stats (one per line: Label | Value)">
            <Textarea name="stats" rows={3} defaultValue={pairs(p.stats, "label", "value")} />
          </Field>
          <Field label="Social links (one per line: Label | URL)">
            <Textarea name="socials" rows={3} defaultValue={pairs(p.socials, "label", "url")} />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Page title"><Input name="seo_title" defaultValue={p.seo?.title ?? ""} /></Field>
          <Field label="Meta description"><Textarea name="seo_description" rows={2} defaultValue={p.seo?.description ?? ""} /></Field>
        </CardContent>
      </Card>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
        {state && <span className={`text-sm ${state.ok ? "text-green-600" : "text-red-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
