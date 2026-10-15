"use client";

import { useEffect } from "react";

export function StartLesson({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    void fetch("/api/mastery/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
  }, [lessonId]);
  return null;
}
