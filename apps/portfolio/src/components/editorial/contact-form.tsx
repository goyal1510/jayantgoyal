"use client";

import { Send } from "lucide-react";
import { useRef, useState } from "react";

import type { FormEvent } from "react";

type FormStatus =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus({ type: "idle" });

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Unable to send your message.");
      }

      formRef.current?.reset();
      setStatus({
        type: "success",
        message: "Message sent. I’ll get back to you as soon as possible.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to send your message.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} className="contact-form" onSubmit={submit}>
      <div className="contact-form__row">
        <label>
          <span>Name</span>
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
          />
        </label>
      </div>
      <label>
        <span>Subject</span>
        <input name="subject" required maxLength={200} />
      </label>
      <label>
        <span>Message</span>
        <textarea name="message" required maxLength={5000} rows={6} />
      </label>
      <div className="contact-form__submit">
        <button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
          <Send aria-hidden="true" />
        </button>
        <p
          className={
            status.type === "error"
              ? "is-error"
              : status.type === "success"
                ? "is-success"
                : undefined
          }
          aria-live="polite"
        >
          {status.type === "idle"
            ? "Share as much or as little context as you have."
            : status.message}
        </p>
      </div>
    </form>
  );
}
