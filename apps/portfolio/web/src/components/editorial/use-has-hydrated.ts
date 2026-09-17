"use client";

import { useSyncExternalStore } from "react";

const subscribeToHydration = () => () => undefined;

/** True after client hydration; false during SSR and the hydration render. */
export function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}
