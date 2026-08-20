#!/usr/bin/env node

import {
  createLedgerPost,
  getLedgerPost,
  publishedLedgerPatch,
  updateLedgerPost,
} from "./lib/ledger.mjs";
import {
  appendPost,
  linkedinPostUrl,
  loadLinkedInToken,
} from "./lib/history.mjs";
import { publishToLinkedIn } from "./lib/linkedin-api.mjs";

export function parsePostArguments(args) {
  const parsed = {
    content: "",
    articleUrl: "",
    writingSlug: "",
    recordId: "",
  };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--url" && args[index + 1]) {
      parsed.articleUrl = args[++index];
    } else if (value === "--writing" && args[index + 1]) {
      parsed.writingSlug = args[++index];
    } else if (value === "--record" && args[index + 1]) {
      parsed.recordId = args[++index];
    } else if (!value.startsWith("--")) {
      parsed.content = value;
    }
  }
  return parsed;
}

function publicationError(error) {
  return error.message.slice(0, 2000);
}

async function resolvePublication(args) {
  const parsed = parsePostArguments(args);
  if (parsed.recordId) {
    if (parsed.content || parsed.articleUrl || parsed.writingSlug) {
      throw new Error(
        "--record uses the saved ledger content and cannot be combined with content options.",
      );
    }
    const record = await getLedgerPost(parsed.recordId);
    if (!["planned", "scheduled", "failed"].includes(record.status)) {
      throw new Error(
        `Ledger record ${record.id} cannot be published from status ${record.status}.`,
      );
    }
    return {
      ledger: await updateLedgerPost(record.id, {
        status: "publishing",
        publication_error: null,
      }),
      content: record.content,
      articleUrl: record.article_url,
      writingSlug: record.writing_slug,
      replacesId: record.replaces_id,
    };
  }
  if (parsed.writingSlug) {
    parsed.articleUrl = `https://jayantgoyal.com/writing/${parsed.writingSlug}`;
    if (!parsed.content) {
      parsed.content =
        `📝 New writing!\n\nRead it here 👇\n${parsed.articleUrl}\n\n` +
        "#webdev #developer #nextjs #coding";
    }
  }
  if (!parsed.content) {
    throw new Error(
      'Usage: post.mjs "Post text" [--url <url>] | --writing <slug> | --record <uuid>',
    );
  }
  const ledger = await createLedgerPost({
    status: "publishing",
    content: parsed.content,
    articleUrl: parsed.articleUrl || null,
    writingSlug: parsed.writingSlug || null,
  });
  return { ledger, ...parsed };
}

async function main() {
  const token = loadLinkedInToken();
  const publication = await resolvePublication(process.argv.slice(2));
  console.log(`\n--- Preview ---\n${publication.content}`);
  if (publication.articleUrl) console.log(`\n${publication.articleUrl}`);
  console.log("--- End ---\n\nPublishing to LinkedIn...");

  let postUrn;
  try {
    postUrn = await publishToLinkedIn({
      accessToken: token.access_token,
      personId: token.person_id,
      content: publication.content,
      articleUrl: publication.articleUrl,
    });
  } catch (error) {
    await updateLedgerPost(publication.ledger.id, {
      status: "failed",
      publication_error: publicationError(error),
    });
    throw error;
  }

  const publishedAt = new Date().toISOString();
  appendPost({
    id: postUrn,
    text: publication.content,
    url: publication.articleUrl || null,
    writingSlug: publication.writingSlug || null,
    createdAt: publishedAt,
    databaseId: publication.ledger.id,
  });
  await updateLedgerPost(
    publication.ledger.id,
    publishedLedgerPatch(postUrn, publishedAt),
  );
  if (publication.replacesId) {
    await updateLedgerPost(publication.replacesId, { status: "replaced" });
  }
  console.log("Published and recorded in Supabase.");
  console.log(linkedinPostUrl(postUrn));
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
