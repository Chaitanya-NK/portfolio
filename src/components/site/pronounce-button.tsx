"use client";
import { useEffect, useRef, useState } from "react";
import { Square, Volume2 } from "lucide-react";

const TYPES: Record<string, string> = {
  webm: 'audio/webm; codecs="opus"', m4a: "audio/mp4", mp4: "audio/mp4", mp3: "audio/mpeg",
  ogg: 'audio/ogg; codecs="opus"', wav: "audio/wav",
};

export function PronounceButton({ name, phonetic, audioUrl }: { name?: string | null; phonetic?: string | null; audioUrl?: string | null }) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  // hide the button when this browser can't play the recording
  useEffect(() => {
    if (!audioUrl) return;
    const ext = audioUrl.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
    const mime = TYPES[ext];
    if (mime && !document.createElement("audio").canPlayType(mime)) setFailed(true);
  }, [audioUrl]);

  function toggle() {
    if (!audioUrl) return;
    if (!audio.current) {
      const a = new Audio(audioUrl);
      a.addEventListener("ended", () => setPlaying(false));
      a.addEventListener("pause", () => setPlaying(false));
      audio.current = a;
    }
    const a = audio.current;
    if (playing) { a.pause(); a.currentTime = 0; return; }
    a.currentTime = 0;
    a.play().then(() => setPlaying(true)).catch(() => setFailed(true));
  }

  const canPlay = Boolean(audioUrl) && !failed;
  if (!canPlay && !phonetic) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      {canPlay && (
        <button
          type="button" onClick={toggle} aria-pressed={playing}
          aria-label={playing ? "Stop the recording" : `Hear how to pronounce ${name ?? "my name"}`}
          data-track="social" data-label="Pronunciation"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[color:var(--line)] px-4 font-medium transition-colors hover:border-[color:var(--accent-ink)]"
        >
          {playing ? <Square className="h-3.5 w-3.5 fill-current" /> : <Volume2 className="h-4 w-4 text-[color:var(--accent-ink)]" />}
          {playing ? "Playing…" : "Hear my name"}
        </button>
      )}
      {phonetic && (
        <span className="text-[color:var(--muted)]">
          Pronounced <span className="font-medium text-[color:var(--fg)]">{phonetic}</span>
        </span>
      )}
    </div>
  );
}
