"use client";

import { useEffect } from "react";

export function StartGovModule({ moduleId }: { moduleId: string }) {
  useEffect(() => {
    void fetch("/api/governance/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId }),
    }).catch(() => undefined);
  }, [moduleId]);

  return null;
}
