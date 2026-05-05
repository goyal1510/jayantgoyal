import { redirect } from "next/navigation";

export default function JobsRoot() {
  redirect("/jobs/listings");
}
