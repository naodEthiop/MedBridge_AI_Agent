"use client";

import { useCallback, useRef, useState } from "react";
import { Bot, ImagePlus, Mic, PlusCircle, Send } from "lucide-react";

import { apiFetchJson } from "@/lib/api/client";

type MedixPayload = {
  message: string;
  urgency: "low" | "medium" | "urgent";
  possibleConditions: string[];
  nextSteps: string[];
  redFlags: string[];
};

export function SymptomCheckerClient(props: {
  onResultChange?: (result: Record<string, unknown> | null) => void;
  bodyPart?: string | null;
}) {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolFeedback, setToolFeedback] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePassSummary, setImagePassSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [recording, setRecording] = useState(false);

  const setFile = useCallback((file: File | null) => {
    setAttachedImage(file);
    setImagePassSummary(null);
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setImagePreviewUrl(null);
    if (file) {
      const url = URL.createObjectURL(file);
      previewObjectUrlRef.current = url;
      setImagePreviewUrl(url);
      setToolFeedback(`${file.name} — Medix AI can review this with your symptoms.`);
    } else {
      setToolFeedback(null);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f && f.type.startsWith("image/")) {
        setFile(f);
      }
    },
    [setFile],
  );

  async function handleMic() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setToolFeedback("Voice needs microphone access, or type your symptoms.");
      return;
    }
    if (recording) return;
    setRecording(true);
    setToolFeedback("Recording… speak now (up to 5 seconds).");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size) chunks.push(ev.data);
      };
      await new Promise<void>((resolve, reject) => {
        mr.onstop = () => resolve();
        mr.onerror = () => reject(new Error("recorder"));
        mr.start();
        window.setTimeout(() => {
          mr.stop();
          stream.getTracks().forEach((t) => t.stop());
        }, 5000);
      });
      const blob = new Blob(chunks, { type: chunks[0]?.type || "audio/webm" });
      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");
      const r = await fetch("/api/ai/speech-to-text", { method: "POST", body: fd, credentials: "include" });
      const j = (await r.json()) as { success?: boolean; text?: string; error?: string };
      if (!r.ok || j.success === false || !j.text?.trim()) {
        setToolFeedback(j.error ?? "Transcription unavailable. Set OPENAI_API_KEY or type instead.");
        return;
      }
      setMessage((prev) => (prev.trim() ? `${prev.trim()} ${j.text}` : j.text!));
      setToolFeedback("Voice added to the text box. Review and send.");
    } catch {
      setToolFeedback("Microphone error — type your symptoms instead.");
    } finally {
      setRecording(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() && !attachedImage) return;

    setLoading(true);
    setError(null);
    setImagePassSummary(null);

    try {
      const bodyLine = props.bodyPart ? `Selected body area: ${props.bodyPart}.` : "";
      const combinedMessage = [bodyLine, message.trim()].filter(Boolean).join("\n");

      const hr = attachedImage
        ? await (async () => {
            const fd = new FormData();
            fd.append("image", attachedImage);
            if (props.bodyPart) fd.append("bodyPart", props.bodyPart);
            if (combinedMessage.trim()) fd.append("message", combinedMessage);
            return apiFetchJson<{ ok?: boolean; medix?: MedixPayload; error?: string }>("/api/ai/process", {
              method: "POST",
              body: fd,
            });
          })()
        : await apiFetchJson<{ ok?: boolean; medix?: MedixPayload; error?: string }>("/api/ai/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: combinedMessage || undefined,
              bodyPart: props.bodyPart ?? null,
              skipTriage: true,
            }),
          });

      setLoading(false);

      if (!hr.success) {
        setError(hr.error);
        props.onResultChange?.(null);
        return;
      }

      const medix = hr.data?.medix;
      if (!medix) {
        setError("Medix AI returned an empty response.");
        props.onResultChange?.(null);
        return;
      }

      const asRecord = { ...medix } as Record<string, unknown>;
      setResult(asRecord);
      props.onResultChange?.(asRecord);
    } catch {
      setLoading(false);
      setError("Something went wrong. Try again.");
      props.onResultChange?.(null);
    }
  }

  const urgency = String(result?.urgency ?? "medium").toLowerCase();
  const isUrgent = urgency === "urgent";

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sahara-primary/20 text-sahara-primary">
            <Bot className="size-5" />
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-none border border-stone-100 bg-white p-6 shadow-ambient">
            <p className="font-semibold text-sahara-fg">Medix AI</p>
            <p className="mt-2 leading-relaxed text-sahara-fg">
              I work like a clinical assistant: we&apos;ll sort through what you&apos;re feeling, how urgent it might be, and
              sensible next steps — without jumping to a firm diagnosis.
            </p>
            <p className="mt-4 leading-relaxed text-sahara-muted text-sm">
              Add symptoms in your own words, optionally upload a relevant image, and pick a body area if it helps.
            </p>
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="rounded-2xl border border-dashed border-stone-200 bg-white/60 px-4 py-3 text-center text-sm text-sahara-muted"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <ImagePlus className="size-4 text-sahara-primary" />
            <span>Drag &amp; drop a medical photo here, or use the + button below.</span>
          </div>
          {imagePreviewUrl ? (
            <div className="mt-3 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- user-provided ephemeral preview blob */}
              <img src={imagePreviewUrl} alt="Attached preview" className="max-h-40 rounded-lg border border-stone-100 object-contain" />
            </div>
          ) : null}
          {attachedImage ? (
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-red-600 hover:underline"
              onClick={() => setFile(null)}
            >
              Remove image
            </button>
          ) : null}
        </div>

        <div className="flex justify-center py-6">
          <div className="flex h-[500px] w-80 flex-col items-center rounded-3xl border border-stone-100 bg-white p-8 shadow-sm">
            <h3 className="mb-6 font-serif text-lg italic text-stone-500">Symptom Localization</h3>
            <div className="relative w-full flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- external reference diagram */}
              <img
                alt="Anatomy Diagram"
                className="h-full w-full object-contain opacity-80 mix-blend-multiply"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBa65wu9xEZbPeCIguuzlPfckJBQbAon6PL-y7wAa-rQOYjyxFBEYifLRssx4TU0Elvk-JoJ_X3Mb62goYa3ZmYt08YWejzFlRwjlrITlkgU11ovrSUwZpz47pucA7fLZOk7Udw-j1OKt3cZoDIIW2tMkIMDGKXxWPAjhYi3ck4gYwWRAok_PKdYkiIjvQ50En08EwyJLr8WzlK1eZxjOWlDPZjm2Y0a4s4Rt2BlIfMegH8RO-BAqLkmjdT8uahfgikP9ckDeOdboo"
              />
              <div className="absolute bottom-1/4 right-1/4 size-12 animate-pulse rounded-full bg-sahara-primary/30" />
              <div className="absolute bottom-1/4 right-1/4 size-4 rounded-full bg-sahara-primary" />
            </div>
            <span className="mt-4 text-center text-xs font-semibold uppercase tracking-widest text-sahara-primary">
              Area: {props.bodyPart ?? "Select a body area"}
            </span>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-sahara-bg/80 pb-2 pt-4 backdrop-blur-md">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-4xl">
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-stone-400 transition-colors hover:text-sahara-primary"
              aria-label="Attach medical image"
            >
              <PlusCircle className="size-5" />
            </button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border-none bg-transparent px-2 py-3 text-sm outline-none"
              placeholder="Describe symptoms, or rely on your photo…"
              type="text"
            />
            <button
              type="button"
              onClick={() => void handleMic()}
              disabled={recording || loading}
              className="p-2 text-stone-400 transition-colors hover:text-sahara-primary disabled:opacity-50"
              aria-label="Record voice (5 seconds)"
            >
              <Mic className={`size-5 ${recording ? "text-red-500" : ""}`} />
            </button>
            <button
              type="submit"
              disabled={loading || (!message.trim() && !attachedImage)}
              className="rounded-xl bg-sahara-primary px-4 py-2 text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              aria-label="Ask Medix AI"
            >
              <Send className="size-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] italic text-stone-500">
            This is not a medical diagnosis. Consult a licensed professional for diagnosis and treatment.
          </p>
          {toolFeedback ? <p className="mt-2 text-center text-xs text-sahara-muted">{toolFeedback}</p> : null}
          {imagePassSummary ? <p className="mt-1 text-center text-xs text-sahara-muted">{imagePassSummary}</p> : null}
        </form>
      </div>

      {error ? (
        <div className="mx-auto w-full max-w-4xl rounded-xl border border-red-300/40 bg-red-100/30 p-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      {result ? (
        <div
          className={`mx-auto w-full max-w-4xl space-y-3 rounded-2xl border bg-sahara-surface-low p-5 ${
            isUrgent ? "border-red-400 ring-2 ring-red-200" : "border-sahara-border/60"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Medix AI</p>
          <p className={`font-semibold capitalize ${isUrgent ? "text-red-700" : "text-sahara-fg"}`}>
            Urgency: {urgency}
            {isUrgent ? " — consider urgent in-person care" : ""}
          </p>
          <p className="text-sm text-sahara-fg">{String(result.message ?? "")}</p>
          {Array.isArray(result.possibleConditions) && result.possibleConditions.length ? (
            <div className="text-sm">
              <span className="font-semibold">Possible considerations (not definitive): </span>
              {(result.possibleConditions as string[]).join(", ")}
            </div>
          ) : null}
          {Array.isArray(result.redFlags) && result.redFlags.length ? (
            <p className="text-sm text-red-800">
              <span className="font-semibold">Warning signs: </span>
              {(result.redFlags as string[]).join(", ")}
            </p>
          ) : null}
          {Array.isArray(result.nextSteps) && result.nextSteps.length ? (
            <ul className="list-inside list-disc text-sm text-sahara-muted">
              {(result.nextSteps as string[]).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
