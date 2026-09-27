
import { ClassAnalytics } from './analytics'

export interface MDMGroupStats {
    label: string
    enrolled: number
    present: number
    served: number
    grainEntitlementKg: number
}

export interface MDMStats {
    primary: MDMGroupStats
    upperPrimary: MDMGroupStats
    totalRiceKg: number
    totalDalKg: number
}

export function calculateMDMStats(classData: ClassAnalytics[]): MDMStats {
    const stats: MDMStats = {
        primary: { label: 'Primary (1-5)', enrolled: 0, present: 0, served: 0, grainEntitlementKg: 0 },
        upperPrimary: { label: 'Upper Primary (6-8)', enrolled: 0, present: 0, served: 0, grainEntitlementKg: 0 },
        totalRiceKg: 0,
        totalDalKg: 0,
    }

    classData.forEach((item) => {
        // Extract numerical grade from class name (e.g., "5A" -> 5)
        // Assume class name starts with the number. 
        const grade = parseInt(item.className.replace(/\D/g, ''), 10)

        if (!isNaN(grade)) {
            if (grade >= 1 && grade <= 5) {
                stats.primary.enrolled += item.totalCount
                stats.primary.present += item.presentCount
                // Default to assumption: anyone present is served
                stats.primary.served += item.presentCount
            } else if (grade >= 6 && grade <= 8) {
                stats.upperPrimary.enrolled += item.totalCount
                stats.upperPrimary.present += item.presentCount
                stats.upperPrimary.served += item.presentCount
            }
            // If grade > 8 (e.g. 9-10), usually not covered by MDM in same way, or High School. 
            // Ignoring for this specific requirement unless user specifies.
        }
    })

    // Calculations
    // Primary: 100g Rice, 20g Dal (approx standard)
    stats.primary.grainEntitlementKg = (stats.primary.served * 100) / 1000
    const primaryDalKg = (stats.primary.served * 20) / 1000

    // Upper Primary: 150g Rice, 30g Dal
    stats.upperPrimary.grainEntitlementKg = (stats.upperPrimary.served * 150) / 1000
    const upperPrimaryDalKg = (stats.upperPrimary.served * 30) / 1000

    stats.totalRiceKg = stats.primary.grainEntitlementKg + stats.upperPrimary.grainEntitlementKg
    stats.totalDalKg = primaryDalKg + upperPrimaryDalKg

    return stats
}
