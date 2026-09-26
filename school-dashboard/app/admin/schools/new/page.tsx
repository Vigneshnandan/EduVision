import { createSchoolAction } from "../actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ChevronLeft, Building2, Sparkles } from "lucide-react"

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
                    <p className="text-xs text-slate-500">Onboard a new educational institution into EduVision.</p>
                </div>
            </div>

            <form action={createSchoolAction}>
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            Institutional Credentials & Profile
                        </CardTitle>
                        <CardDescription>
                            Enter basic school metadata. A unique code will be assigned automatically if omitted.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="school_name">Official School Name *</Label>
                            <Input
                                id="school_name"
                                name="school_name"
                                placeholder="e.g. Government Girls High School"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="school_code">Institutional Code (Optional)</Label>
                                <span className="text-[11px] text-blue-600 flex items-center gap-1 font-medium">
                                    <Sparkles className="h-3 w-3" /> Auto-generated if left blank
                                </span>
                            </div>
                            <Input
                                id="school_code"
                                name="school_code"
                                placeholder="e.g. GGHS-1049 (or leave blank)"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address / Block / District</Label>
                            <Input
                                id="address"
                                name="address"
                                placeholder="e.g. Sector 4, North District, Jaipur"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="contact_email">Headmaster / Admin Email</Label>
                                <Input
                                    id="contact_email"
                                    name="contact_email"
                                    type="email"
                                    placeholder="principal@gghs.edu.in"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_phone">Contact Number</Label>
                                <Input
                                    id="contact_phone"
                                    name="contact_phone"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label htmlFor="status">Deployment Tier</Label>
                            <select
                                id="status"
                                name="status"
                                defaultValue="trial"
                                className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white border-input"
                            >
                                <option value="trial">Trial Deployment (Pilot evaluation)</option>
                                <option value="active">Active Production (Full institutional license)</option>
                            </select>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t py-4 bg-slate-50/50">
                        <Link href="/admin/schools">
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            Register Institution
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
