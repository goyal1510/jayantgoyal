export function buildEmailLinkPresentation(
  emailCodePoints: number[],
  hasHydrated: boolean,
) {
  if (!hasHydrated) {
    return {
      href: undefined,
      detailLabel: "Email me",
    };
  }

  const email = String.fromCodePoint(...emailCodePoints);
  return {
    href: `mailto:${email}`,
    detailLabel: email,
  };
}
