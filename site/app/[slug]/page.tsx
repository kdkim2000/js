import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Legacy URL format /[slug] is no longer supported.
// All content is now under /sites/[siteId]/[slug].
export default async function LegacySlugPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/?legacy=${slug}`);
}
