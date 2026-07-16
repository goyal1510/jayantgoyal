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
    subject: getField(formData, "subject"),
    message: getField(formData, "message"),
  });

  return result.success ? { success: true } : { error: result.error };
}
