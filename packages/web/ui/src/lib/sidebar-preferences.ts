export const SIDEBAR_STATE_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_WIDTH_COOKIE_NAME = "sidebar_width";
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 480;
export const SIDEBAR_DEFAULT_WIDTH = 256;

export interface SidebarPreferenceValues {
  state?: string | null;
  width?: string | null;
}

export interface SidebarPreferences {
  defaultOpen: boolean;
  defaultWidth: number;
}

export function clampSidebarWidth(width: number): number {
  return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width));
}

export function parseSidebarPreferences({
  state,
  width,
}: SidebarPreferenceValues): SidebarPreferences {
  const parsedWidth = Number(width);

  return {
    defaultOpen: state !== "false",
    defaultWidth: clampSidebarWidth(parsedWidth || SIDEBAR_DEFAULT_WIDTH),
  };
}
