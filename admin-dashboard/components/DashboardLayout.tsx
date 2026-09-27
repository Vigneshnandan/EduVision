"use client"

import { useState } from "react"
import { Sidebar } from "@/components/Sidebar"
import { cn } from "@/lib/utils"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50 flex w-full">
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
            <main
                className={cn(
                    "flex-1 min-w-0 transition-all duration-300 ease-in-out px-4 py-8",
                    isCollapsed ? "ml-20" : "ml-64"
                )}
            >
                {children}
            </main>
        </div>
    )
}
