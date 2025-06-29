'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserCheck, MessageSquare, LogOut, LayoutDashboard, Scale, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (isClient) {
      const isAdmin = localStorage.getItem('admin_auth') === 'true';
      if (!isAdmin && pathname !== '/admin/login') {
        router.replace('/admin/login');
      }
    }
  }, [isClient, pathname, router]);
  
  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.replace('/admin/login');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/leaders', label: 'Leaders', icon: UserCheck },
    { href: '/admin/ratings', label: 'Ratings', icon: MessageSquare },
  ];
  
  if (!isClient) {
    return null;
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') !== 'true') {
      return null;
  }

  return (
    <div className="min-h-screen w-full bg-secondary/50">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
            <div className="border-b p-4">
                 <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Scale className="h-6 w-6 text-primary" />
                    <span>PolitiRate Admin</span>
                </Link>
            </div>
            <nav className="flex flex-col gap-2 p-4 flex-grow">
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            pathname === item.href && "bg-secondary text-primary"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                ))}
            </nav>
            <div className="mt-auto p-4">
                <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </aside>
        <div className="flex flex-col flex-1">
            <header className="flex h-14 items-center gap-4 border-b bg-background px-6 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
                <div className="sm:hidden">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Scale className="h-6 w-6 text-primary" />
                        <span>Admin</span>
                    </Link>
                </div>
            </header>
            <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
