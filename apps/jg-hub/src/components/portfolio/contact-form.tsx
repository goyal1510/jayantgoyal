"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitContactForm } from "@/app/(protected)/contact/actions";
import { Loader2 } from "lucide-react";

type ContactFormProps = {
  // No props needed - recipient email is fixed in the server action
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        "Send message"
      )}
    </Button>
  );
}

export function ContactForm(_props: ContactFormProps) {
  const [state, formAction] = useActionState(submitContactForm, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Message sent successfully! I'll get back to you soon.");
      // Reset form
      if (formRef.current) {
        formRef.current.reset();
      }
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Name</span>
          <input
            name="name"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
            placeholder="Your name"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
            placeholder="you@example.com"
          />
        </label>
      </div>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Subject</span>
        <input
          name="subject"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
          placeholder="Project idea, role, or question"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Message</span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
          placeholder="Share a few details..."
        />
      </label>
      <SubmitButton />
    </form>
  );
}
