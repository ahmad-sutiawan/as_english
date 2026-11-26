import { redirect } from "next/navigation";

export default function MasteryRedirectPage() {
  redirect("/grammar?tab=mastery");
}
