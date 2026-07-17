import { createSign } from "node:crypto";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_EXPORT_MIME_TYPE = "application/pdf";
const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const RESUME_FILE_NAME = "Jayant_Resume.pdf";
const STATIC_RESUME_PATH = "/assets/Jayant_Resume.pdf";

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function getPrivateKey(): string | undefined {
  return process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function createServiceAccountAssertion(
  email: string,
  privateKey: string,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: email,
    scope: DRIVE_READONLY_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 60 * 60,
    iat: now,
  };

  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(privateKey);

  return `${unsignedToken}.${base64Url(signature)}`;
}

async function getAccessToken(
  email: string,
  privateKey: string,
): Promise<string> {
  const assertion = createServiceAccountAssertion(email, privateKey);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Google token request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google token response did not include an access token");
  }

  return data.access_token;
}

async function exportResumePdf(
  documentId: string,
  accessToken: string,
): Promise<ArrayBuffer> {
  const exportUrl = new URL(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(documentId)}/export`,
  );
  exportUrl.searchParams.set("mimeType", DRIVE_EXPORT_MIME_TYPE);

  const response = await fetch(exportUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Google Drive export failed with status ${response.status}`,
    );
  }

  return response.arrayBuffer();
}

export async function GET(request: Request) {
  const documentId = process.env.GOOGLE_RESUME_DOCUMENT_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = getPrivateKey();

  if (!documentId || !serviceAccountEmail || !privateKey) {
    return NextResponse.redirect(new URL(STATIC_RESUME_PATH, request.url), 307);
  }

  try {
    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
    const pdf = await exportResumePdf(documentId, accessToken);

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": DRIVE_EXPORT_MIME_TYPE,
        "Content-Disposition": `attachment; filename="${RESUME_FILE_NAME}"`,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Resume export failed", error);

    return NextResponse.json(
      { error: "Unable to export resume PDF." },
      { status: 502 },
    );
  }
}
