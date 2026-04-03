import { TrackPageClient } from "../../src/components/public/TrackPageClient.jsx";

export default async function TrackPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  return <TrackPageClient initialQuery={resolvedSearchParams?.query || ""} />;
}
