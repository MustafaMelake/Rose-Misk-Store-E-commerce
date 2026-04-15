import { auth } from "../../../lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "../../components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
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
