"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type ContactFormState = {
  error?: string;
  success?: boolean;
};

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const subject = formData.get("subject");
  const message = formData.get("message");

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return { error: "All fields are required" };
  }

  // Fixed recipient email
  const recipientEmail = "goyal151002@gmail.com";

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    return { error: "Invalid email format" };
  }

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return { error: "Email service is not configured. Please contact support." };
  }

  try {
    // Resend requires verified domains for 'from' field. Use a verified domain or Resend's test domain.
    // The user's email is set in replyTo so replies will go to them.
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>";
    
    const { data, error } = await resend.emails.send({
      from: fromEmail, // Use verified domain or Resend's test domain
      to: [recipientEmail], // Fixed recipient email: goyal151002@gmail.com
      replyTo: `${String(name)} <${String(email)}>`, // User's email for replies (shows their name)
      subject: String(subject),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="margin-top: 20px;">
            <p><strong>Name:</strong> ${String(name)}</p>
            <p><strong>Email:</strong> ${String(email)}</p>
            <p><strong>Subject:</strong> ${String(subject)}</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <strong>Message:</strong>
            <p style="margin-top: 10px; white-space: pre-wrap;">${String(message)}</p>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${String(name)}
Email: ${String(email)}
Subject: ${String(subject)}

Message:
${String(message)}
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
