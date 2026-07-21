import { DashboardContent } from "@/components/dashboard-content";
import { DashboardHero } from "@/components/dashboard-hero";
import { getCurrentUser } from "@/lib/server/auth-context";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <>
      <DashboardHero firstName={user?.firstName} />
      <DashboardContent />
    </>
  );
}
