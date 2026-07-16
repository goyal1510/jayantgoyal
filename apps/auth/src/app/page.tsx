import { redirect } from "next/navigation";

export default function AuthHome() {
  redirect("/login");
}
