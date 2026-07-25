import { permanentRedirect } from "next/navigation";

export default function LegacyProjectsPage() {
  permanentRedirect("/work");
}
