import type { LessonStatus } from "@/types/mastery";

export const STATUS_LABEL: Record<LessonStatus, string> = {
  not_started: "Belum mulai",
  in_progress: "Sedang berjalan",
  completed: "Selesai",
  mastered: "Dikuasai",
  needs_review: "Perlu diulang",
};

export function statusLabel(status: string | undefined): string {
  if (!status || !(status in STATUS_LABEL)) return STATUS_LABEL.not_started;
  return STATUS_LABEL[status as LessonStatus];
}
