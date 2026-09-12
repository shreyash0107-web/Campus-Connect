import { EmptyState } from "@/components/states";
export default function NotFound() {
  return <main id="main-content" className="mx-auto max-w-2xl px-5 py-16"><EmptyState title="This page took a different path." description="The profile or opportunity may have been removed, or this link isn’t quite right." href="/dashboard" action="Back to dashboard" /></main>;
}
