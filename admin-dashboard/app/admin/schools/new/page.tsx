import { NewSchoolForm } from "./NewSchoolForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function NewSchoolPage() {
    return (
        <div className="p-8 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin/schools">
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Register New School</h1>
                    <p className="text-xs text-slate-500">
                        Onboard a new educational institution into EduVision and set up initial login access.
                    </p>
                </div>
            </div>

            <NewSchoolForm />
        </div>
    )
}
