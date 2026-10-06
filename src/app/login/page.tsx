import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="px-4 py-16">
      <Suspense fallback={<p className="text-center text-sm text-[var(--muted)]">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
