import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { SITE_NAME } from "@/lib/site";

/** Static shell — admin state is resolved on the client to keep public pages cacheable. */
export function SiteHeader() {
  return <SiteHeaderClient siteName={SITE_NAME} />;
}
