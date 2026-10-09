"use client";

import { useEffect } from "react";
import RouteError from "@/components/ui/RouteError";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <RouteError error={error} reset={reset} />;
}
