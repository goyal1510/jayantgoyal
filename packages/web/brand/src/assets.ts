export const BRAND_ASSET_DIRECTORY = "assets/brand";

export const BRAND_ASSET_SOURCE_DIRECTORY = "assets/brand/web";

export const BRAND_SOCIAL_ASSET_SOURCE_DIRECTORY = "assets/brand/social";

export const BRAND_ASSET_FILES = [
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
] as const;

export const BRAND_ASSET_PATHS = {
  favicon: `/${BRAND_ASSET_DIRECTORY}/favicon.ico`,
  favicon16: `/${BRAND_ASSET_DIRECTORY}/favicon-16x16.png`,
  favicon32: `/${BRAND_ASSET_DIRECTORY}/favicon-32x32.png`,
  appleTouchIcon: `/${BRAND_ASSET_DIRECTORY}/apple-touch-icon.png`,
  android192: `/${BRAND_ASSET_DIRECTORY}/android-chrome-192x192.png`,
  android512: `/${BRAND_ASSET_DIRECTORY}/android-chrome-512x512.png`,
} as const;
