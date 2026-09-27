import { getDashboardData } from "@/lib/dashboard";
import { DashboardClient } from "./DashboardClient";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function SchoolDashboardPage() {
    const data = await getDashboardData();
    if (!data) {
        redirect("/login");
    }

    return <DashboardClient initialData={data} />;
}
