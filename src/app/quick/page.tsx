import { redirect } from "next/navigation";

export default function QuickRedirectPage() {
  redirect("/dashboard");
}
