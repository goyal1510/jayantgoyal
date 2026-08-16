export interface RouteNavigationIntent {
  href: string | null;
  currentPathname: string;
  currentUrl: string;
  target?: string | null;
  download?: boolean;
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export function getInternalRouteChangePath({
  href,
  currentPathname,
  currentUrl,
  target,
  download = false,
  button = 0,
  metaKey = false,
  ctrlKey = false,
  shiftKey = false,
  altKey = false,
}: RouteNavigationIntent): string | null {
  if (
    !href ||
    (target && target !== "_self") ||
    download ||
    button !== 0 ||
    metaKey ||
    ctrlKey ||
    shiftKey ||
    altKey
  ) {
    return null;
  }

  try {
    const current = new URL(currentUrl);
    const destination = new URL(href, current);

    if (
      !["http:", "https:"].includes(destination.protocol) ||
      destination.origin !== current.origin ||
      destination.pathname === currentPathname
    ) {
      return null;
    }

    return destination.pathname;
  } catch {
    return null;
  }
}
