"use server";

import { Resend } from "resend";

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5_000;

// Lazy initialization to avoid build-time errors
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

type ContactFormState = {
  error?: string;
  success?: boolean;
};

function getField(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] ?? character;
  });
}

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = getField(formData, "name", MAX_NAME_LENGTH);
  const email = getField(formData, "email", MAX_EMAIL_LENGTH);
  const subject = getField(formData, "subject", MAX_SUBJECT_LENGTH);
  const message = getField(formData, "message", MAX_MESSAGE_LENGTH);

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return { error: "All fields are required" };
  }

  // Fixed recipient email
  const recipientEmail = "goyal151002@gmail.com";

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email format" };
  }

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return {
      error: "Email service is not configured. Please contact support.",
    };
  }

  try {
    // Resend requires verified domains for 'from' field. Use a verified domain or Resend's test domain.
    // The user's email is set in replyTo so replies will go to them.
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ??
      "Portfolio Contact <onboarding@resend.dev>";

    // Initialize Resend client only when needed (at runtime, not build time)
    const resend = getResendClient();

    const { error } = await resend.emails.send({
      from: fromEmail, // Use verified domain or Resend's test domain
      to: [recipientEmail], // Fixed recipient email: goyal151002@gmail.com
      replyTo: `${name} <${email}>`,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="margin-top: 20px;">
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <strong>Message:</strong>
            <p style="margin-top: 10px; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { error: "Failed to send email. Please try again later." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return { error: "Failed to send message. Please try again." };
  }
}
