"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Building2,
    LayoutDashboard,
    PlusCircle,
    Users,
    Layers,
    ChevronLeft,
    ChevronRight,
    Shield,
    ShieldCheck
} from "lucide-react"

const sidebarItems = [
    {
        title: "Platform Command Center",
        href: "/admin",
        icon: LayoutDashboard,
        matchExact: true,
    },
    {
        title: "Institutions Directory",
        href: "/admin/schools",
        icon: Building2,
        matchExact: true,
    },
    {
        title: "Master Teacher Roster",
        href: "/admin/teachers",
        icon: Users,
    },
    {
        title: "School Inspector Drill-down",
        href: "/admin/drill-down",
        icon: Layers,
    },
    {
        title: "Security & Audit Logs",
        href: "/admin/audit",
        icon: ShieldCheck,
    },
    {
        title: "Register New School",
        href: "/admin/schools/new",
        icon: PlusCircle,
    },
]

interface SidebarProps {
    isCollapsed: boolean
    toggleSidebar: () => void
}

export function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div
            className={cn(
                "flex flex-col h-full border-r bg-slate-900 text-white fixed left-0 top-0 bottom-0 shadow-lg z-50 transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                {!isCollapsed && (
                    <Link href="/admin" className="flex flex-col gap-1 overflow-hidden whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-blue-400 tracking-tight">EduVision</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                                Gov Admin
                            </span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-400">
                            State Directorate Command
                        </span>
                    </Link>
                )}
                {isCollapsed && (
                    <div className="flex flex-col items-center gap-1 overflow-hidden whitespace-nowrap mx-auto">
                        <span className="text-xl font-extrabold text-blue-400 tracking-tight">EV</span>
                        <Shield className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                )}
            </div>

            {/* Collapse toggle */}
            <div className="absolute -right-3 top-9 z-50">
                <button
                    onClick={toggleSidebar}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 shadow-md hover:bg-slate-700 text-slate-300"
                >
                    {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </button>
            </div>

            {/* Navigation items */}
            <div className="flex-1 py-6 flex flex-col gap-1 px-3">
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {!isCollapsed ? "Platform Governance" : "•••"}
                </div>
                {sidebarItems.map((item) => {
                    const isActive = item.matchExact
                        ? pathname === item.href || (item.href === "/admin" && pathname === "/")
                        : pathname === item.href || pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            title={isCollapsed ? item.title : ""}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap overflow-hidden",
                                isActive
                                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                                isCollapsed && "justify-center px-0"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 min-w-[1.25rem]", isActive ? "text-white" : "text-slate-400")} />
                            {!isCollapsed && <span>{item.title}</span>}
                        </Link>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60">
                {!isCollapsed ? (
                    <div className="text-xs text-slate-400 text-center">
                        <p className="font-semibold text-slate-300">Central Admin Console</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Multi-Tenant Gov Engine • v1.0</p>
                    </div>
                ) : (
                    <div className="text-xs text-slate-500 text-center font-bold">
                        ADM
                    </div>
                )}
            </div>
        </div>
    )
}
