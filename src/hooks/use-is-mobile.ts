import { useSyncExternalStore } from "react";
import { MOBILE_BREAKPOINT_PX } from "@/constants/layout";

const QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True below the mobile breakpoint; follows window resizes. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches);
}
