
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
    };

    return (
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground animate-in fade-in-0 slide-in-from-top-4 duration-500 shadow-lg">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between p-2.5 gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="hidden sm:flex items-center justify-center p-2 bg-white/20 rounded-full flex-shrink-0">
                            <Megaphone className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="text-sm font-semibold flex-1 min-w-0">
                            {notifications.length === 1 ? (
                                <p className="truncate">{notifications[0].message}</p>
                            ) : (
                                <Carousel setApi={setApi} className="w-full">
                                    <CarouselContent>
                                        {notifications.map((n) => (
                                            <CarouselItem key={n.id}>
                                                <p className="truncate">{n.message}</p>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={handleDismiss}>
                            <span className="sr-only">Dismiss</span>
                            <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
