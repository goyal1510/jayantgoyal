const HEADLINE_BREAK = /[—.–;:]/;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Distinctive headline clauses that should also appear in nearby body copy. */
export function distinctiveHeadlinePhrases(headline: string) {
  return headline
    .split(HEADLINE_BREAK)
    .map((part) => part.replace(/^(from|to)\s+/i, "").trim())
    .filter((part) => normalize(part).split(" ").filter((word) => word.length > 3).length >= 2);
}

/** Repeats missing headline clauses in the body so H1 language is not isolated. */
export function echoHeadlineInBody(headline: string, body: string) {
  const normalizedBody = normalize(body);
  const missing = distinctiveHeadlinePhrases(headline).filter((phrase) => {
    const normalizedPhrase = normalize(phrase);
    return normalizedPhrase.length > 0 && !normalizedBody.includes(normalizedPhrase);
  });

  if (missing.length === 0) return body;

  const lead = missing
    .map((phrase) =>
      phrase
        .replace(/\.$/, "")
        .replace(/^./, (character) => character.toUpperCase()),
    )
    .join(". ");

  return `${lead}. ${body}`;
}
