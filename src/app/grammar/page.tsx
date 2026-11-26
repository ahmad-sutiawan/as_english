import { GrammarHub, type GrammarTab } from "@/components/grammar-hub";
import { GrammarReference } from "@/components/grammar-reference";
import { LobbyFrame } from "@/components/lobby-frame";
import { MasteryOverview } from "@/components/mastery/mastery-overview";
import { getGrammarBook } from "@/lib/grammar";
import { getModules, getPhases, getPublishedLessons } from "@/lib/mastery/catalog";
import { finalExam, foundationExam } from "@/lib/mastery/content/exams";
import { requireLearnerId } from "@/lib/mastery/guard";
import { examUnlocked, loadDashboard } from "@/lib/mastery/store";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function GrammarPage({ searchParams }: Props) {
  const userId = await requireLearnerId();
  const { tab } = await searchParams;
  const initialTab: GrammarTab = tab === "referensi" ? "referensi" : "mastery";

  const data = await loadDashboard(userId);
  const phases = getPhases();
  const modules = getModules();
  const published = getPublishedLessons();
  const rowSnap = data.rows.map((row) => ({ lessonId: row.lessonId, status: row.status }));
  const foundation = examUnlocked(foundationExam, rowSnap);
  const finalGate = examUnlocked(finalExam, rowSnap);

  const book = getGrammarBook();
  const totalLaws = book.chapters.reduce((sum, chapter) => sum + chapter.laws.length, 0);

  return (
    <LobbyFrame
      kicker="Kurikulum & Referensi"
      title="Grammar"
      lede="Pelajari grammar bertahap lewat Kurikulum Mastery, atau buka Referensi Hukum dan tabel rumus kapan pun susunan kalimat macet."
    >
      <GrammarHub
        key={initialTab}
        initialTab={initialTab}
        masteryBadge={`${data.percent}% · ${data.completed}/${data.publishedCount} lesson`}
        referenceBadge={`${totalLaws} hukum · ${book.charts.length} tabel`}
        masteryContent={
          <MasteryOverview
            data={data}
            phases={phases}
            modules={modules}
            published={published}
            foundation={foundation}
            finalGate={finalGate}
          />
        }
        referenceContent={<GrammarReference book={book} />}
      />
    </LobbyFrame>
  );
}
