import { permanentRedirect } from "next/navigation";

export default function LegacyBlogPage() {
  permanentRedirect("/writing");
}
