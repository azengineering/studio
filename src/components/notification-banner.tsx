
'use client';

import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { getActiveNotifications, type SiteNotification } from '@/data/notifications';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';

export default function NotificationBanner() {
    const [notifications, setNotifications] = useState<SiteNotification[]>([]);
    const [api, setApi] = useState<CarouselApi>();
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Don't show banner on admin pages
        if (pathname.startsWith('/admin')) {
            setIsVisible(false);
            return;
        }

        const fetchNotifications = async () => {
            const dismissed = sessionStorage.getItem('notification_banner_dismissed') === 'true';
            if (dismissed) {
                return;
            }

            const activeNotifications = await getActiveNotifications();
            setNotifications(activeNotifications);
            if (activeNotifications.length > 0) {
                setIsVisible(true);
            }
        };

        fetchNotifications();
    }, [pathname]);

    useEffect(() => {
        if (!api) return;

        const interval = setInterval(() => {
            if (api.canScrollNext()) {
                api.scrollNext();
            } else {
                api.scrollTo(0);
            }
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [api]);

    if (!isVisible || notifications.length === 0) {
        return null;
    }

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('notification_banner_dismissed', 'true');
    };

    return (
        <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-accent/90 px-6 py-2.5 sm:px-3.5 sm:before:flex-1 text-accent-foreground shadow-md backdrop-blur-sm">
            <div className="flex items-center gap-x-2">
                <Megaphone className="h-5 w-5" aria-hidden="true" />
                <p className="text-sm font-semibold leading-6">
                    {notifications.length === 1 ? (
                        notifications[0].message
                    ) : (
                        <Carousel setApi={setApi} className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl">
                            <CarouselContent>
                                {notifications.map((n) => (
                                    <CarouselItem key={n.id}>
                                        <p className="truncate">{n.message}</p>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    )}
                </p>
            </div>
            <div className="flex flex-1 justify-end">
                <Button variant="ghost" size="icon" className="-m-3 h-7 w-7" onClick={handleDismiss}>
                    <span className="sr-only">Dismiss</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
