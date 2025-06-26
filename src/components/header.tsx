"use client";

import { Scale, LogOut, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { auth, firebaseEnabled } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useState } from 'react';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
];

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
           <Avatar>
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
              <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/my-activities')}>
          <User className="mr-2 h-4 w-4" />
          <span>My Activities</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const MobileNav = () => (
      <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden">
                <Menu />
                <span className="sr-only">Open menu</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left">
            <div className="flex flex-col h-full">
                 <div className="flex items-center justify-between border-b pb-4">
                     <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <Scale className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold font-headline text-primary">PolitiRate</span>
                    </Link>
                </div>
                <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map(link => (
                    <SheetClose asChild key={link.href}>
                        <Link href={link.href} className="text-lg font-medium hover:text-primary transition-colors">
                           {link.label}
                        </Link>
                    </SheetClose>
                ))}
                </nav>
                <div className="mt-auto pt-8">
                     {firebaseEnabled && user ? (
                        <>
                            <SheetClose asChild>
                                <Button onClick={() => router.push('/my-activities')} className="w-full justify-start mb-2" variant="ghost">
                                    <User className="mr-2 h-4 w-4" /> My Activities
                                </Button>
                            </SheetClose>
                            <SheetClose asChild>
                                <Button onClick={handleLogout} className="w-full justify-start" variant="ghost">
                                    <LogOut className="mr-2 h-4 w-4" /> Logout
                                </Button>
                            </SheetClose>
                        </>
                    ) : firebaseEnabled && (
                        <SheetClose asChild>
                            <Button onClick={() => router.push('/login')} className="w-full">
                                Login
                            </Button>
                        </SheetClose>
                    )}
                </div>
            </div>
        </SheetContent>
      </Sheet>
  );

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold font-headline text-primary">PolitiRate</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
             {navLinks.map(link => (
                <Link key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                </Link>
             ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
                {!loading && firebaseEnabled && (user ? <UserMenu /> : <Button onClick={() => router.push('/login')}>Login</Button>)}
            </div>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
