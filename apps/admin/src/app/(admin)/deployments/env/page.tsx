import { redirect } from "next/navigation";

export default function RetiredEnvironmentManagerPage() {
  redirect("/deployments");
}
