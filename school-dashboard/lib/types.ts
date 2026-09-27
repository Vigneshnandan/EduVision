export interface StudentProfile {
    student_id: string;
    name: string;
    class_name: string;
    roll_number?: string;
    guardian_name?: string;
    contact_number?: string;
    address?: string;
    blood_group?: string;
}

export interface ClassAnalytics {
    className: string;
    presentCount: number;
    totalCount: number;
    percentage: number;
    manualCount?: number;
}

export interface AtRiskStudent {
    studentId: string;
    name: string;
    className: string;
    attendancePct: number;
    status: 'Critical' | 'Warning' | 'Good';
}

export interface ClassRecord {
    class_id: string;
    school_id: string;
    class_name: string;
    class_teacher_id?: string | null;
    teacher_name?: string | null;
    student_count?: number;
    created_at?: string;
}

export interface TeacherRecord {
    teacher_id: string;
    school_id: string;
    teacher_name: string;
    teacher_login_id: string;
    role: 'teacher' | 'school_admin';
    is_active: boolean;
    auth_user_id?: string | null;
    created_at: string;
}

export interface SchoolHoliday {
    holiday_id: string;
    school_id: string;
    holiday_date: string;
    label: string;
    created_at?: string;
}

export interface MonthlyTrend {
    currentMonthOverallPct: number;
    previousMonthOverallPct: number;
    diffPct: number;
    classComparisons: {
        className: string;
        currentPct: number;
        previousPct: number;
        diffPct: number;
    }[];
}

export interface StudentDayLog {
    date: number;
    dateStr: string;
    isPresent: boolean;
    isManual: boolean;
    markedBy?: string | null;
    correctionReason?: string | null;
}
