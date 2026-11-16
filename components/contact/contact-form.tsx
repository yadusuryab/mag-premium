"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

const FIELD =
  "w-full border border-neutral-200 bg-white px-5 py-3 text-base font-medium text-black outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black";
const LABEL = "mb-2 block text-sm font-semibold";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("request failed");
      form.reset();
      setStatus("sent");
    } catch {
      if (!ctrl.signal.aborted) setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        className="self-start rounded-3xl bg-neutral-100 p-6 md:p-8"
      >
        <h2 className="text-2xl font-extrabold uppercase leading-none tracking-tight">
          Message sent
        </h2>
        <p className="mt-3 text-base font-medium text-neutral-500">
          Thanks for writing. We’ll reply within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 rounded-full border border-neutral-300 bg-white px-6 py-3 text-base font-semibold transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          Send another
        </button>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={sending}
      className="space-y-5 self-start rounded-3xl bg-neutral-100 p-6 md:p-8"
    >
      <h2 className="text-2xl font-extrabold uppercase leading-none tracking-tight">
        Send a message
      </h2>

      <div>
        <label htmlFor="cf-name" className={LABEL}>
          Name
        </label>
        <input
          id="cf-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={100}
          required
          placeholder="Your name"
          className={`${FIELD} rounded-full`}
        />
      </div>

      <div>
        <label htmlFor="cf-email" className={LABEL}>
          Email
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          placeholder="you@example.com"
          className={`${FIELD} rounded-full`}
        />
      </div>

      <div>
        <label htmlFor="cf-message" className={LABEL}>
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          minLength={10}
          maxLength={2000}
          required
          placeholder="How can we help?"
          className={`${FIELD} resize-none rounded-3xl`}
        />
      </div>

      {/* Honeypot: invisible and not focusable; bots tend to fill it */}
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="invisible absolute h-0 w-0"
      />

      {status === "error" && (
        <p role="alert" className="text-sm font-semibold">
          We couldn’t send your message. Please try WhatsApp or email instead.
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending && (
          <Loader2
            className="h-5 w-5 animate-spin motion-reduce:animate-none"
            strokeWidth={1.75}
            aria-hidden
          />
        )}
        {sending ? "Sending" : "Send message"}
      </button>
    </form>
  );
}