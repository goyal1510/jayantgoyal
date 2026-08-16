"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getInternalRouteChangePath } from "../lib/route-change";
import { Spinner } from "./spinner";

const ROUTE_CHANGE_TIMEOUT_MS = 5_000;

export function RouteChangeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isChanging, setIsChanging] = useState(false);
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (pathname !== previousPathname.current) {
      previousPathname.current = pathname;
      setIsChanging(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isChanging) return;

    const timeout = window.setTimeout(
      () => setIsChanging(false),
      ROUTE_CHANGE_TIMEOUT_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [isChanging]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const targetPath = getInternalRouteChangePath({
        href: anchor.getAttribute("href"),
        currentPathname: pathname,
        currentUrl: window.location.href,
        target: anchor.target,
        download: anchor.hasAttribute("download"),
        button: event.button,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
      });

      if (targetPath) setIsChanging(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  return (
    <>
      {isChanging && (
        <div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[2px]"
          role="status"
          aria-label="Loading next page"
        >
          <Spinner size="lg" />
        </div>
      )}
      {children}
    </>
  );
}
