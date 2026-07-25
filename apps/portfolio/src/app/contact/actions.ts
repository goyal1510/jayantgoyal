"use server";

import { deliverContactSubmission } from "@/lib/contact/server";

type ContactFormState = {
  error?: string;
  success?: boolean;
};

function getField(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string") return "";
  return value;
}

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const result = await deliverContactSubmission({
    name: getField(formData, "name"),
    email: getField(formData, "email"),
    project: getField(formData, "project"),
    stage: getField(formData, "stage"),
    timeline: getField(formData, "timeline"),
    outcome: getField(formData, "outcome"),
    context: getField(formData, "context"),
  });

  return result.success ? { success: true } : { error: result.error };
}
