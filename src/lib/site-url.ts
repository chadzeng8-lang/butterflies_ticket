/** Canonical public site origin, e.g. https://cumusical.xyz */
export function getPublicSiteUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // Never treat ephemeral Netlify deploy hosts as the public site.
    if (url.hostname.endsWith(".netlify.app")) return null;
    return url.origin;
  } catch {
    return null;
  }
}
