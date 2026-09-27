
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    FileText,
    Settings,
    GraduationCap,
    School,
    Users,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Classes",
        href: "/classes",
        icon: School,
    },
    {
        title: "Teachers",
        href: "/school/teachers",
        icon: Users,
    },
    {
        title: "Students",
        href: "/students",
        icon: GraduationCap,
    },
    {
        title: "Reports Center",
        href: "/reports",
        icon: FileText,
    },
    {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
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
                "flex flex-col h-full border-r bg-white fixed left-0 top-0 bottom-0 shadow-sm z-50 transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6 border-b flex items-center justify-between">
                {!isCollapsed && (
                    <Link href="/" className="flex flex-col gap-1 overflow-hidden whitespace-nowrap">
                        <span className="text-2xl font-extrabold text-blue-600 tracking-tight">EduVision</span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                            AI Attendance System
                        </span>
                    </Link>
                )}
                {isCollapsed && (
                    <div className="flex flex-col gap-1 overflow-hidden whitespace-nowrap mx-auto">
                        <span className="text-xl font-extrabold text-blue-600 tracking-tight">EV</span>
                    </div>
                )}

                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 absolute right-4 top-6"
                    style={{ right: isCollapsed ? 'auto' : '1.5rem', left: isCollapsed ? '50%' : 'auto', transform: isCollapsed ? 'translateX(-50%) translateY(40px)' : 'none' }}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <div className="sr-only">Collapse</div> // Hidden on expanded, maybe a dedicated toggle button/icon is better?
                    )}
                </button>
                {/* Better Toggle: Always visible hamburger or chevron? */}
                {/* Let's put a toggle button at the bottom or top corner */}
            </div>

            {/* Re-implementing clearer toggle button */}
            <div className="absolute -right-3 top-9 z-50">
                <button
                    onClick={toggleSidebar}
                    className="flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-md hover:bg-slate-100"
                >
                    {isCollapsed ? <ChevronRight className="h-3 w-3 text-slate-600" /> : <ChevronLeft className="h-3 w-3 text-slate-600" />}
                </button>
            </div>


            <div className="flex-1 py-6 flex flex-col gap-1 px-3">
                {sidebarItems.map((item) => (
                    <Link
                        key={item.title}
                        href={(item as any).disabled ? "#" : item.href}
                        title={isCollapsed ? item.title : ""}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap overflow-hidden",
                            (item as any).disabled && "opacity-50 cursor-not-allowed",
                            pathname === item.href
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5 min-w-[1.25rem]", pathname === item.href ? "text-blue-600" : "text-slate-400")} />
                        {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t bg-slate-50">
                {!isCollapsed ? (
                    <div className="text-xs text-slate-400 text-center">
                        &copy; 2026 EduVision v1.0
                        <br />
                        Offline First
                    </div>
                ) : (
                    <div className="text-xs text-slate-400 text-center font-bold">
                        v1.0
                    </div>
                )}
            </div>
        </div>
    )
}
