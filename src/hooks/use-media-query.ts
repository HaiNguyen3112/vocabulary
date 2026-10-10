import { useSyncExternalStore } from "react";
import { LG_BREAKPOINT_PX, MOBILE_BREAKPOINT_PX, SMALL_BREAKPOINT_PX } from "@/constants/layout";

/** True while `query` matches; follows window resizes and OS setting changes. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
  );
}

/** Below 600px — word list renders as cards. */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
}

/** 992px and up — top-bar shell and word-bank split view. */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${LG_BREAKPOINT_PX}px)`);
}

/** Below 400px — the study board has 2 columns. */
export function useIsSmallScreen(): boolean {
  return useMediaQuery(`(max-width: ${SMALL_BREAKPOINT_PX - 1}px)`);
}
