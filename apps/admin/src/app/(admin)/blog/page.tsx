import { permanentRedirect } from "next/navigation";

export default function LegacyWritingWorkspacePage() {
  permanentRedirect("/portfolio/writing");
}
