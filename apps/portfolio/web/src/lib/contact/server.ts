import { Resend } from "resend";

import {
  CONTACT_STAGE_OPTIONS,
  CONTACT_TIMELINE_OPTIONS,
  getContactOptionLabel,
} from "./options";
import { getPortfolioContactEmail } from "../portfolio/editorial-server";

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 320;
const MAX_PROJECT_LENGTH = 600;
const MAX_OUTCOME_LENGTH = 1_200;
const MAX_CONTEXT_LENGTH = 3_000;

type ContactSubmission = {
  name: string;
  email: string;
  project: string;
  stage: string;
  stageLabel: string;
  timeline: string;
  timelineLabel: string;
  outcome: string;
  context: string;
};

export type ContactDeliveryResult =
  | { success: true; messageId?: string }
  | { success: false; error: string; status: 400 | 500 };

function normalizeField(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function normalizeSubmission(
  input: Record<string, unknown>,
): ContactSubmission {
  const stage = normalizeField(input.stage, 60);
  const timeline = normalizeField(input.timeline, 60);

  return {
    name: normalizeField(input.name, MAX_NAME_LENGTH),
    email: normalizeField(input.email, MAX_EMAIL_LENGTH),
    project: normalizeField(input.project, MAX_PROJECT_LENGTH),
    stage,
    stageLabel: getContactOptionLabel(CONTACT_STAGE_OPTIONS, stage) ?? "",
    timeline,
    timelineLabel:
      getContactOptionLabel(CONTACT_TIMELINE_OPTIONS, timeline) ?? "",
    outcome: normalizeField(input.outcome, MAX_OUTCOME_LENGTH),
    context: normalizeField(input.context, MAX_CONTEXT_LENGTH),
  };
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

export async function deliverContactSubmission(
  input: Record<string, unknown>,
): Promise<ContactDeliveryResult> {
  const submission = normalizeSubmission(input);
  const { name, email, project, stageLabel, timelineLabel, outcome, context } =
    submission;

  if (
    !name ||
    !email ||
    !project ||
    !stageLabel ||
    !timelineLabel ||
    !outcome
  ) {
    return { success: false, error: "All fields are required", status: 400 };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email format", status: 400 };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return {
      success: false,
      error: "Email service is not configured. Please contact support.",
      status: 500,
    };
  }

  try {
    const recipient = await getPortfolioContactEmail();
    const resend = new Resend(apiKey);
    const from =
      process.env.RESEND_FROM_EMAIL ??
      "Portfolio Contact <onboarding@resend.dev>";
    const { data, error } = await resend.emails.send({
      from,
      to: [recipient],
      replyTo: `${name} <${email}>`,
      subject: `Portfolio enquiry: ${stageLabel} · ${timelineLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="margin-top: 20px;">
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Stage:</strong> ${escapeHtml(stageLabel)}</p>
            <p><strong>Timeline:</strong> ${escapeHtml(timelineLabel)}</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <strong>What they are building:</strong>
            <p style="margin-top: 10px; white-space: pre-wrap;">${escapeHtml(project)}</p>
            <strong>Outcome needed:</strong>
            <p style="margin-top: 10px; white-space: pre-wrap;">${escapeHtml(outcome)}</p>
            ${
              context
                ? `<strong>Additional context:</strong>
            <p style="margin-top: 10px; white-space: pre-wrap;">${escapeHtml(context)}</p>`
                : ""
            }
          </div>
        </div>
      `,
      text: `New Portfolio Enquiry

Name: ${name}
Email: ${email}
Stage: ${stageLabel}
Timeline: ${timelineLabel}

What they are building:
${project}

Outcome needed:
${outcome}

Additional context:
${context || "None provided"}`,
    });

    if (error) {
      console.error("Resend error:", error);
      return {
        success: false,
        error: "Failed to send email. Please try again later.",
        status: 500,
      };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return {
      success: false,
      error: "Failed to send message. Please try again.",
      status: 500,
    };
  }
}
