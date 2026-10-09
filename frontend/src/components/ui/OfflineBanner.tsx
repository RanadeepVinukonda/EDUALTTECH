"use client";

import { useEffect, useState } from "react";
import CloudOff from "@mui/icons-material/CloudOff";

/**
 * Connectivity hint only — the browser reporting "online" does not prove the
 * API is reachable. We never claim verified connectivity here.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900"
    >
      <CloudOff fontSize="small" aria-hidden />
      You appear to be offline. Some actions may fail — changes aren’t saved until the server confirms them.
    </div>
  );
}
