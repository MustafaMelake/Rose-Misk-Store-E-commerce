import { redirect } from "next/navigation";
import Sidebar from "../../components/admin/Sidebar";
import { getCurrentUser } from "@/lib/auth-guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Shares the same request-cached session as the page + action guards.
  const user = await getCurrentUser();

  // Guests are sent to login with a return path; a signed-in non-admin gets a
  // clear, localized "access denied" page instead of a silent bounce (G15).
  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        <div className="w-full px-6 py-10 md:px-10 lg:px-16">{children}</div>
      </main>
    </div>
  );
}
