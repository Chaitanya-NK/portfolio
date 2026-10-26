"use client";
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CharacterCount from "@tiptap/extension-character-count";
import Youtube from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { createLowlight, common } from "lowlight";
import {
  Bold, Italic, Underline, Strikethrough, Code, Link as LinkIcon, List, ListOrdered,
  ListChecks, Quote, Minus, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ImagePlus, Video, Undo2, Redo2, Highlighter, Subscript as SubIcon,
  Superscript as SupIcon, RemoveFormatting, Table as TableIcon, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { aiAltText } from "@/app/admin/ai-actions";
import { uploadFiles } from "@/lib/upload-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const lowlight = createLowlight(common);
const COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa"];
const LANGS: [string, string][] = [
  ["auto", "Auto-detect"], ["mermaid", "Mermaid diagram"], ["bash", "Bash / shell"], ["yaml", "YAML"], ["json", "JSON"],
  ["javascript", "JavaScript"], ["typescript", "TypeScript"], ["python", "Python"], ["sql", "SQL"], ["java", "Java"],
  ["csharp", "C#"], ["go", "Go"], ["php", "PHP"], ["xml", "HTML / XML"], ["css", "CSS"], ["ini", "INI / config"],
  ["diff", "Diff"], ["markdown", "Markdown"], ["plaintext", "Plain text"],
];


export type EditorOut = { json: unknown; html: string; words: number };

async function uploadImage(file: File) {
  const r = await uploadFiles(file, { folder: "blog", accept: ["image/*"], maxMB: 8 });
  return r[0]?.url ?? null;
}

function Btn({ label, active, disabled, onClick, children }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className={`inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md px-2 text-sm transition-colors hover:bg-neutral-100 disabled:opacity-40 ${active ? "bg-indigo-100 text-indigo-700" : "text-neutral-700"}`}
    >
      {children}
    </button>
  );
}
const Sep = () => <span className="mx-1 h-5 w-px bg-neutral-200" />;
const ic = "h-4 w-4";

export function RichEditor({ initialJSON, initialHTML, onChange }: {
  initialJSON?: unknown; initialHTML?: string; onChange: (o: EditorOut) => void;
}) {
  const editorRef = useRef<Editor | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialog, setDialog] = useState<null | "link" | "youtube">(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [altBusy, setAltBusy] = useState(false);

  const insertFiles = async (files: File[]) => {
    setUploading(true);
    for (const f of files) {
      const src = await uploadImage(f);
      if (src) {
        editorRef.current?.chain().focus()
          .setImage({ src, alt: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") }).run();
      }
    }
    setUploading(false);
  };

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      Placeholder.configure({ placeholder: "Start writing… paste or drop images anywhere." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Typography, Subscript, Superscript, CharacterCount,
      Youtube.configure({ nocookie: true, controls: true }),
      Table, TableRow, TableHeader, TableCell,
      TaskList, TaskItem.configure({ nested: true }),
    ],
    content: (initialJSON as object) ?? initialHTML ?? "",
    editorProps: {
      attributes: { class: "rich mx-auto min-h-[460px] max-w-[56rem] px-4 py-4 outline-none sm:px-6 sm:py-5" },
      handlePaste: (_v, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (!files.length) return false;
        insertFiles(files);
        return true;
      },
      handleDrop: (_v, event, _s, moved) => {
        if (moved) return false;
        const files = Array.from((event as DragEvent).dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (!files.length) return false;
        event.preventDefault();
        insertFiles(files);
        return true;
      },
    },
    onUpdate: ({ editor }) =>
      onChange({ json: editor.getJSON(), html: editor.getHTML(), words: editor.storage.characterCount.words() }),
  });

  useEffect(() => { editorRef.current = editor; }, [editor]);

  if (!editor) return <div className="min-h-[560px] rounded-xl border bg-white" />;


  const fillAlt = async (all: boolean) => {
    const targets: { pos: number; src: string }[] = [];
    if (all) {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && !String(node.attrs.alt ?? "").trim() && node.attrs.src) targets.push({ pos, src: String(node.attrs.src) });
      });
    } else {
      const sel = editor.state.selection as unknown as { node?: { type: { name: string }; attrs: { src?: string } }; from: number };
      if (sel.node?.type.name === "image" && sel.node.attrs.src) targets.push({ pos: sel.from, src: sel.node.attrs.src });
    }
    if (!targets.length) { toast.info("No images need alt text."); return; }
    setAltBusy(true);
    let done = 0;
    for (const t of targets.slice(0, 12)) {
      const r = await aiAltText(t.src);
      if (!r.ok) { toast.error(r.error); break; }
      const cur = editor.state.doc.nodeAt(t.pos);
      if (cur && cur.type.name === "image") editor.view.dispatch(editor.state.tr.setNodeMarkup(t.pos, undefined, { ...cur.attrs, alt: r.text }));
      done++;
    }
    setAltBusy(false);
    if (done) toast.success(`Added alt text to ${done} image${done === 1 ? "" : "s"}. Please check it.`);
  };

  const heading = [1, 2, 3, 4].find((l) => editor.isActive("heading", { level: l }));
  const block = heading ? String(heading) : "p";
  const words = editor.storage.characterCount.words();
  const chain = () => editor.chain().focus();
  const normalize = (u: string) => (/^(https?:|mailto:|tel:|\/|#)/i.test(u) ? u : `https://${u}`);

  const openLink = () => { setUrl(editor.getAttributes("link").href ?? ""); setDialog("link"); };
  const applyDialog = () => {
    const u = url.trim();
    if (dialog === "link") {
      if (!u) chain().extendMarkRange("link").unsetLink().run();
      else chain().extendMarkRange("link").setLink({ href: normalize(u) }).run();
    } else if (dialog === "youtube" && u) {
      chain().setYoutubeVideo({ src: normalize(u) }).run();
    }
    setDialog(null);
    setUrl("");
  };

  return (
    <div className="rounded-xl border bg-white">
      <div className="sticky top-14 z-10 flex flex-nowrap items-center gap-0.5 overflow-x-auto rounded-t-xl border-b bg-white p-2 lg:top-0 md:flex-wrap md:overflow-visible">
        <Btn label="Undo" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}><Undo2 className={ic} /></Btn>
        <Btn label="Redo" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}><Redo2 className={ic} /></Btn>
        <Sep />
        <Select value={block} onValueChange={(v) => {
          if (v == null) return;
          const s = String(v);
          if (s === "p") chain().setParagraph().run();
          else chain().setHeading({ level: Number(s) as 1 | 2 | 3 | 4 }).run();
        }}>
          <SelectTrigger className="h-8 w-32 shrink-0" aria-label="Text style"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Paragraph</SelectItem>
            <SelectItem value="1">Heading 1</SelectItem>
            <SelectItem value="2">Heading 2</SelectItem>
            <SelectItem value="3">Heading 3</SelectItem>
            <SelectItem value="4">Heading 4</SelectItem>
          </SelectContent>
        </Select>
        <Sep />
        <Btn label="Bold" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}><Bold className={ic} /></Btn>
        <Btn label="Italic" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}><Italic className={ic} /></Btn>
        <Btn label="Underline" active={editor.isActive("underline")} onClick={() => chain().toggleUnderline().run()}><Underline className={ic} /></Btn>
        <Btn label="Strikethrough" active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()}><Strikethrough className={ic} /></Btn>
        <Btn label="Inline code" active={editor.isActive("code")} onClick={() => chain().toggleCode().run()}><Code className={ic} /></Btn>
        <Popover>
          <PopoverTrigger
            aria-label="Highlight"
            onMouseDown={(e) => e.preventDefault()}
            className={`inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md px-2 hover:bg-neutral-100 ${editor.isActive("highlight") ? "bg-indigo-100 text-indigo-700" : "text-neutral-700"}`}
          >
            <Highlighter className={ic} />
          </PopoverTrigger>
          <PopoverContent className="flex w-auto gap-2 p-2">
            {COLORS.map((c) => (
              <button key={c} type="button" aria-label={`Highlight ${c}`} style={{ background: c }}
                className="h-7 w-7 rounded-full border" onClick={() => chain().setHighlight({ color: c }).run()} />
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => chain().unsetHighlight().run()}>None</Button>
          </PopoverContent>
        </Popover>
        <Btn label="Subscript" active={editor.isActive("subscript")} onClick={() => chain().toggleSubscript().run()}><SubIcon className={ic} /></Btn>
        <Btn label="Superscript" active={editor.isActive("superscript")} onClick={() => chain().toggleSuperscript().run()}><SupIcon className={ic} /></Btn>
        <Btn label="Link" active={editor.isActive("link")} onClick={openLink}><LinkIcon className={ic} /></Btn>
        <Sep />
        <Btn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()}><List className={ic} /></Btn>
        <Btn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()}><ListOrdered className={ic} /></Btn>
        <Btn label="Task list" active={editor.isActive("taskList")} onClick={() => chain().toggleTaskList().run()}><ListChecks className={ic} /></Btn>
        <Btn label="Quote" active={editor.isActive("blockquote")} onClick={() => chain().toggleBlockquote().run()}><Quote className={ic} /></Btn>
        <Btn label="Code block" active={editor.isActive("codeBlock")} onClick={() => chain().toggleCodeBlock().run()}><span className="font-mono text-xs">{"{ }"}</span></Btn>
        <Btn label="Divider" onClick={() => chain().setHorizontalRule().run()}><Minus className={ic} /></Btn>
        <Sep />
        <Btn label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => chain().setTextAlign("left").run()}><AlignLeft className={ic} /></Btn>
        <Btn label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => chain().setTextAlign("center").run()}><AlignCenter className={ic} /></Btn>
        <Btn label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => chain().setTextAlign("right").run()}><AlignRight className={ic} /></Btn>
        <Btn label="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => chain().setTextAlign("justify").run()}><AlignJustify className={ic} /></Btn>
        <Sep />
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { const f = Array.from(e.target.files ?? []); if (fileRef.current) fileRef.current.value = ""; if (f.length) insertFiles(f); }} />
        <Btn label="Upload image" disabled={uploading} onClick={() => fileRef.current?.click()}><ImagePlus className={ic} /></Btn>
        <Btn label="Embed YouTube video" onClick={() => { setUrl(""); setDialog("youtube"); }}><Video className={ic} /></Btn>
        <Btn label="Insert table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className={ic} /></Btn>
        <Btn label="Clear formatting" onClick={() => chain().clearNodes().unsetAllMarks().run()}><RemoveFormatting className={ic} /></Btn>
        <Btn label="AI: write missing alt text for all images" disabled={altBusy} onClick={() => fillAlt(true)}><Sparkles className={ic} /></Btn>
        {uploading && <span className="ml-2 text-xs text-neutral-500">Uploading image…</span>}
      </div>

      {editor.isActive("image") && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-neutral-50 px-3 py-2 text-sm">
          <span className="font-medium">Image alt text</span>
          <Input className="h-8 min-w-0 flex-1 basis-48 bg-white sm:max-w-md" placeholder="Describe the image for accessibility and SEO"
            value={editor.getAttributes("image").alt ?? ""}
            onChange={(e) => editor.chain().updateAttributes("image", { alt: e.target.value }).run()} />
          <Button type="button" variant="outline" size="sm" disabled={altBusy} onClick={() => fillAlt(false)}><Sparkles className="mr-1.5 h-3.5 w-3.5" />{altBusy ? "Writing…" : "Suggest alt text"}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => chain().deleteSelection().run()}>Remove image</Button>
        </div>
      )}

      {editor.isActive("table") && (
        <div className="flex flex-wrap items-center gap-1 border-b bg-neutral-50 px-3 py-2 text-sm">
          <span className="mr-1 font-medium">Table</span>
          {[
            ["+ Col left", () => chain().addColumnBefore().run()],
            ["+ Col right", () => chain().addColumnAfter().run()],
            ["− Column", () => chain().deleteColumn().run()],
            ["+ Row above", () => chain().addRowBefore().run()],
            ["+ Row below", () => chain().addRowAfter().run()],
            ["− Row", () => chain().deleteRow().run()],
            ["Header row", () => chain().toggleHeaderRow().run()],
            ["Delete table", () => chain().deleteTable().run()],
          ].map(([l, fn]) => (
            <Button key={l as string} type="button" variant="outline" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={fn as () => void}>
              {l as string}
            </Button>
          ))}
        </div>
      )}

      {editor.isActive("codeBlock") && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-neutral-50 px-3 py-2 text-sm">
          <span className="font-medium">Code language</span>
          <Select
            value={editor.getAttributes("codeBlock").language || "auto"}
            onValueChange={(v) => v != null && editor.chain().focus().updateAttributes("codeBlock", { language: String(v) === "auto" ? null : String(v) }).run()}
          >
            <SelectTrigger className="h-8 w-48" aria-label="Code language"><SelectValue /></SelectTrigger>
            <SelectContent>{LANGS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <span className="text-xs text-neutral-500">Pick “Mermaid diagram” and type e.g. <code>flowchart LR; A[Commit] --&gt; B[Build] --&gt; C[Deploy]</code></span>
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="flex justify-between border-t bg-neutral-50 px-4 py-2 text-xs text-neutral-500">
        <span>{words} words · {editor.storage.characterCount.characters()} characters</span>
        <span>{Math.max(1, Math.ceil(words / 200))} min read</span>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialog === "link" ? "Insert link" : "Embed YouTube video"}</DialogTitle></DialogHeader>
          <Input autoFocus placeholder={dialog === "link" ? "https://example.com" : "https://www.youtube.com/watch?v=…"}
            value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyDialog(); } }} />
          <DialogFooter>
            {dialog === "link" && editor.isActive("link") && (
              <Button variant="outline" onClick={() => { chain().extendMarkRange("link").unsetLink().run(); setDialog(null); }}>Remove link</Button>
            )}
            <Button onClick={applyDialog}>{dialog === "link" ? "Apply" : "Embed"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
