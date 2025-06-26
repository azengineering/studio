"use client";

import { Scale, LogOut, User, Menu, Globe } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage, type Language } from '@/context/language-context';

export default function Header() {
  const { user, loading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/about', label: t('header.about') },
  ];

  if (user) {
    navLinks.push({ href: '/my-activities', label: t('header.myActivities') });
  }

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
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('header.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const LanguageSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('header.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setLanguage('en')}>
          {t('header.english')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLanguage('hi')}>
          {t('header.hindi')}
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
                    <div className="mb-6">
                        <p className="mb-2 font-medium text-muted-foreground px-1">{t('header.language')}</p>
                        <RadioGroup defaultValue={language} onValueChange={(value) => setLanguage(value as Language)}>
                            <div className="flex items-center space-x-2 p-1">
                                <RadioGroupItem value="en" id="lang-en-mobile" />
                                <Label htmlFor="lang-en-mobile">{t('header.english')}</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-1">
                                <RadioGroupItem value="hi" id="lang-hi-mobile" />
                                <Label htmlFor="lang-hi-mobile">{t('header.hindi')}</Label>
                            </div>
                        </RadioGroup>
                    </div>
                     {firebaseEnabled && user ? (
                        <>
                            <SheetClose asChild>
                                <Button onClick={handleLogout} className="w-full justify-start" variant="ghost">
                                    <LogOut className="mr-2 h-4 w-4" /> {t('header.logout')}
                                </Button>
                            </SheetClose>
                        </>
                    ) : firebaseEnabled && (
                        <SheetClose asChild>
                            <Button onClick={() => router.push('/login')} className="w-full">
                                {t('header.login')}
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
            <div className="hidden md:flex items-center gap-2">
                <LanguageSelector />
                {!loading && firebaseEnabled && (user ? <UserMenu /> : <Button onClick={() => router.push('/login')}>{t('header.login')}</Button>)}
            </div>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
