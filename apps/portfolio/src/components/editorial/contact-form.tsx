"use client";

import { Send } from "lucide-react";
import { useRef, useState } from "react";

import {
  CONTACT_STAGE_OPTIONS,
  CONTACT_TIMELINE_OPTIONS,
} from "@/lib/contact/options";
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
        <span>What are you building?</span>
        <textarea name="project" required maxLength={600} rows={3} />
      </label>
      <div className="contact-form__row">
        <label>
          <span>Current stage</span>
          <select name="stage" required defaultValue="">
            <option value="" disabled>
              Select stage
            </option>
            {CONTACT_STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Target timeline</span>
          <select name="timeline" required defaultValue="">
            <option value="" disabled>
              Select timeline
            </option>
            {CONTACT_TIMELINE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>What outcome do you need?</span>
        <textarea name="outcome" required maxLength={1_200} rows={3} />
      </label>
      <label>
        <span>Anything else that would help?</span>
        <textarea name="context" maxLength={3_000} rows={4} />
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
            ? "A short brief is enough. I normally reply within one business day."
            : status.message}
        </p>
      </div>
    </form>
  );
}
