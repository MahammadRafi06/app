import { redirect } from "next/navigation";

export default function RepositoriesCompatPage() {
  redirect("/argocd-settings/repositories");
}
