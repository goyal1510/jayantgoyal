export function getCompactSectionHeading(
  eyebrow: string,
  fallbackTitle: string,
) {
  const separatorIndex = eyebrow.indexOf("/");

  if (separatorIndex === -1) {
    return {
      label: eyebrow.trim(),
      title: fallbackTitle,
    };
  }

  const label = eyebrow.slice(0, separatorIndex).trim();
  const title = eyebrow.slice(separatorIndex + 1).trim();

  return {
    label: label || eyebrow.trim(),
    title: title || fallbackTitle,
  };
}

/** Split CMS copy stored as `one|two|three` into trimmed parts. */
export function splitCmsParts(value: string, count: number): string[] {
  const parts = value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length === count ? parts : [];
}

