"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type BreadcrumbContextValue = {
  label: string | null;
  setLabel: (label: string | null) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  label: null,
  setLabel: () => {},
});

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [label, setLabel] = useState<string | null>(null);
  return (
    <BreadcrumbContext.Provider value={{ label, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}

/**
 * Hook for pages to set a dynamic last-segment label on the global breadcrumb.
 * Pass `null` to clear (and the breadcrumb falls back to its default).
 * Cleared automatically on unmount.
 */
export function useDynamicBreadcrumb(label: string | null) {
  const { setLabel } = useContext(BreadcrumbContext);
  const stableSet = useCallback(
    (l: string | null) => setLabel(l),
    [setLabel]
  );
  useEffect(() => {
    stableSet(label);
    return () => stableSet(null);
  }, [label, stableSet]);
}
