#!/usr/bin/env node

import { createInterface } from "node:readline/promises";

import { signInToSupabase } from "./lib/database-session.mjs";

async function promptLine(question) {
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    return (await prompt.question(question)).trim();
  } finally {
    prompt.close();
  }
}

function promptHidden(question) {
  if (!process.stdin.isTTY) {
    throw new Error(
      "Database authentication requires an interactive terminal.",
    );
  }
  process.stdout.write(question);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error) => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (character) => {
      if (character === "\u0003")
        return finish(new Error("Authentication cancelled."));
      if (character === "\r" || character === "\n") return finish();
      if (character === "\u007f") {
        value = value.slice(0, -1);
        return;
      }
      value += character;
    };
    process.stdin.on("data", onData);
  });
}

async function main() {
  const email = await promptLine("Supabase account email: ");
  const password = await promptHidden("Supabase account password: ");
  const identity = await signInToSupabase(email, password);
  console.log(
    `Authenticated for the LinkedIn ledger as ${identity.email ?? email}.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
