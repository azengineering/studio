
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSiteSettings } from '@/data/settings';

export default function MaintenanceEnforcer() {
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      if (pathname.startsWith('/admin') || pathname.startsWith('/maintenance') || pathname.startsWith('/api')) {
        return;
      }

      try {
        const settings = await getSiteSettings();
        
        const maintenanceActive = settings.maintenance_active;
        if (!maintenanceActive) {
            return;
        }

        const now = new Date();
        const startTime = settings.maintenance_start ? new Date(settings.maintenance_start) : null;
        const endTime = settings.maintenance_end ? new Date(settings.maintenance_end) : null;

        let isMaintenanceWindow = false;
        if (startTime) {
            if (endTime) {
                if (now >= startTime && now <= endTime) {
                    isMaintenanceWindow = true;
                }
            } else {
                if (now >= startTime) {
                    isMaintenanceWindow = true;
                }
            }
        } else {
            isMaintenanceWindow = true;
        }

        if (isMaintenanceWindow) {
          router.replace('/maintenance');
        }

      } catch (error) {
        console.error("Failed to check maintenance status:", error);
      }
    };

    checkMaintenanceStatus();
  }, [pathname, router]);

  return null;
}
