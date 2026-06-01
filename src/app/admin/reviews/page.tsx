import { getPendingReviews } from "../../../../lib/actions/review.actions";
import AdminReviewList from "@/components/admin/AdminReviewList";
export default async function AdminReviewsPage() {
  const pendingReviews = await getPendingReviews();

  return (
    <div className="flex-1 space-y-2 p-2 pt-1 min-h-screen bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="prata-regular text-4xl text-black dark:text-white mb-2">
            Review Moderation
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage and verify customer feedback before it goes public.
          </p>
        </header>

        {pendingReviews.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-3xl">
            <p className="text-gray-400">
              No pending reviews to moderate. All caught up! ✨
            </p>
          </div>
        ) : (
          <AdminReviewList initialReviews={pendingReviews} />
        )}
      </div>
    </div>
  );
}
