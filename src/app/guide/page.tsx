import Link from "next/link";
import { redirect } from "next/navigation";
import { GuideModuleList } from "@/components/guide-module-list";
import { auth } from "@/lib/auth";
import { getModules } from "@/lib/content";
import {
  BUILD_SESSION_SIZE,
  BUILD_XP_DRILL,
  BUILD_XP_PERFECT_BONUS,
} from "@/lib/build";
import { QUICK_SESSION_SIZE } from "@/lib/quick";
import { SPEAK_XP_COMPLETE, SPEAK_XP_MASTERED } from "@/lib/speak";
import { LobbyFrame, lobbyCard } from "@/components/lobby-frame";
import { PERSONA_LABEL, getActivePersona } from "@/lib/persona";

const surfaces = [
  {
    href: "/dashboard",
    title: "Dashboard",
    when: "Buka ini setiap kali mulai latihan. Papan sudah memilih langkah berikutnya.",
    do: "Lihat sapaan, cakupan modul, XP gabungan, dan streak aktif. Tombol utama membawa ke Review, Susun, Bicara, atau Cepat sesuai kondisi akun.",
    next: "Ikuti tombol itu sebelum memilih tema sendiri. Angka di kartu jalur hanya memberitahu mana yang tertinggal.",
  },
  {
    href: "/build",
    title: "Susun",
    when: "Pakai ini untuk mengunci urutan kata. Tema selain Dasar terbuka setelah penempatan lulus.",
    do: `Pilih satu tema. Susun chip menjadi kalimat, lalu ubah kalimat itu menjadi negatif, pertanyaan, past, atau future. Sesi mengambil sampai ${BUILD_SESSION_SIZE} kalimat. +${BUILD_XP_DRILL} XP per kalimat selesai, +${BUILD_XP_PERFECT_BONUS} jika seluruh sesi benar pada percobaan pertama.`,
    next: "Mulai dari tema Dasar. Setelah urutan kata terasa stabil, pilih satu tema percakapan yang sama dengan pekerjaan hari itu. Pindah ke Bicara untuk kalimat yang baru saja disusun.",
  },
  {
    href: "/speak",
    title: "Bicara",
    when: "Pakai ini untuk mengucapkan kalimat tanpa melihat teks English.",
    do: `Satu item berjalan enam tahap: Listen, Retrieve, Construct, Speak it, Work scenario, lalu Say again. Jawaban diucapkan, tidak diketik. +${SPEAK_XP_COMPLETE} XP saat selesai, +${SPEAK_XP_MASTERED} jika item itu dikuasai.`,
    next: "Ulangi item yang masih tersendat sebelum menambah level. Setelah suara mengikuti susunan kata, jaga pengenalan lewat Cepat.",
  },
  {
    href: "/quick",
    title: "Cepat",
    when: "Pakai ini untuk menjaga akurasi setelah konstruksi dan ucapan sudah jalan.",
    do: `${QUICK_SESSION_SIZE} soal pemanasan dari arti, tanpa nyawa dan tanpa XP. Jawaban yang salah langsung masuk lapis keluarkan pada sesi yang sama.`,
    next: "Pemanasan selesai berarti pengenalan hari itu sudah dicek. Lanjut ke produksi di sesi latihan.",
  },
  {
    href: "/review",
    title: "Review",
    when: "Pakai ini di awal sesi setiap kali ada soal jatuh tempo.",
    do: "Antrian berisi kalimat dari modul, Susun, dan Bicara. Jaraknya 1, 3, 7, 16, lalu 35 hari. Benar pada jarak 35 hari mengeluarkan item dari antrian harian.",
    next: "Dashboard membuka sesi latihan, yang mengerjakan antrian ini sebelum soal baru.",
  },
  {
    href: "/dashboard",
    title: "Modul",
    when: "Pakai ini untuk menambah frasa baru setelah antrian Review kosong.",
    do: "Setiap soal menampilkan arti dan susunan dalam Bahasa Indonesia. Jawaban yang diketik tetap English. Modul Percakapan Berantai memakai dialog beberapa giliran.",
    next: "Selesaikan satu soal baru di akhir latihan. Soal itu masuk jadwal Review. Katalog modul ada di bawah dashboard.",
  },
] as const;

export default async function GuidePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const persona = await getActivePersona(session.user.id);
  if (!persona) redirect("/dashboard");

  const modules = getModules(persona);
  const audience =
    persona === "home"
      ? "Latihan ini untuk percakapan di rumah: keluarga, tetangga, sekolah, dan urusan sehari-hari."
      : "Latihan ini untuk IT Manager, SRE, dan Fullstack.";

  return (
    <LobbyFrame
      kicker="Arah latihan"
      title="Panduan pembelajaran"
      lede="Cara memakai AS English dari papan latihan sampai kalimat kerja keluar sendiri. Ikuti urutan ini; dashboard sudah memakai aturan yang sama untuk memilih langkah berikutnya."
    >
      <div className="grid gap-3 lg:grid-cols-2">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Untuk siapa</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          {audience} Penjelasan, nama
          menu, dan umpan balik memakai Bahasa Indonesia. Kalimat yang disusun,
          diketik, atau diucapkan tetap English, dengan terjemahan tetap supaya
          arti dan urutan kata terlihat bersamaan.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Prinsip</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Tidak ada model bahasa di balik penilaian. Setiap jawaban dicocokkan
          persis dengan pola yang sudah disiapkan. Arti Indonesia membantu
          memahami. Yang menghitung sebagai latihan adalah produksi English:
          menyusun, mengucapkan, atau mengetik kalimat yang benar.
        </p>
      </section>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-3xl text-[var(--ink)]">
          Loop harian yang paling efektif
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Satu sesi kerja cukup untuk satu putaran di halaman Latihan. XP tidak menentukan langkah berikutnya.
        </p>
        <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
          <li className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 px-5 py-4">
            <span className="font-medium text-[var(--ink)]">1. Penempatan sekali. </span>
            Dua belas kalimat Dasar. Sepuluh benar membuka tema percakapan.
          </li>
          <li className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 px-5 py-4">
            <span className="font-medium text-[var(--ink)]">2. Pemanasan empat soal. </span>
            Pilih dari arti. Yang salah langsung diketik tanpa melihat English.
          </li>
          <li className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 px-5 py-4">
            <span className="font-medium text-[var(--ink)]">3. Item jatuh tempo. </span>
            Modul, Susun, dan Bicara berbagi satu jadwal: 1, 3, 7, 16, 35 hari.
          </li>
          <li className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 px-5 py-4">
            <span className="font-medium text-[var(--ink)]">4. Satu transformasi dan satu ucapan. </span>
            Teks English hanya terdengar, lalu diucapkan dari arti.
          </li>
          <li className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 px-5 py-4">
            <span className="font-medium text-[var(--ink)]">5. Satu soal baru, lalu transfer. </span>
            Transfer menerima salah satu dari dua atau tiga kalimat model.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl text-[var(--ink)]">Enam permukaan</h2>
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {surfaces.map((surface) => (
            <li
              key={surface.title}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl text-[var(--ink)]">
                  {surface.title}
                </h3>
                <Link
                  href={surface.href}
                  className="inline-flex h-10 shrink-0 items-center rounded-full border border-[var(--border)] px-4 text-sm text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Buka
                </Link>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                <span className="text-[var(--ink)]">Kapan. </span>
                {surface.when}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                <span className="text-[var(--ink)]">Yang dikerjakan. </span>
                {surface.do}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                <span className="text-[var(--ink)]">Kapan pindah. </span>
                {surface.next}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
        <h2 className="font-display text-3xl text-[var(--ink)]">
          Urutan seminggu
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Tiap hari kerja, kerjakan satu putaran di Latihan. Dashboard membuka
          penempatan sekali, lalu sesi yang mengulang kalimat jatuh tempo
          sebelum menambah soal. Tema selain Dasar terbuka setelah sepuluh dari
          dua belas kalimat penempatan benar.
        </p>
      </section>

      <section className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
        <h2 className="font-display text-3xl text-[var(--ink)]">
          Cara membaca progres
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
          <li>
            XP Susun, Bicara, dan Cepat dihitung terpisah. Dashboard menjumlahkan
            ketiganya sebagai XP terkumpul.
          </li>
          <li>
            Streak tiap jalur naik sekali pada hari itu, menurut kalender
            Jakarta, dan kembali ke 1 jika sehari terlewat. Streak aktif di
            papan adalah nilai tertinggi dari ketiga jalur.
          </li>
          <li>
            Cakupan modul adalah soal modul yang sudah selesai dibanding seluruh
            soal. Angka itu terpisah dari XP latihan cepat.
          </li>
          <li>
            Akurasi dan jumlah dikuasai berasal dari percobaan modul. Itulah
            bahan antrian Review.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl text-[var(--ink)]">
          Modul {PERSONA_LABEL[persona]}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Kerjakan satu modul yang paling dekat dengan pekerjaan minggu ini.
          Satu soal selesai sudah cukup untuk menutup latihan hari itu.
        </p>
        <GuideModuleList
          modules={modules.map((mod) => ({
            id: mod.id,
            titleId: mod.titleId,
            description: mod.description,
            itemCount: mod.itemCount,
          }))}
        />
      </section>
    </LobbyFrame>
  );
}
