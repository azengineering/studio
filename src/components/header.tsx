"use client";

import { Scale, Menu, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage, type Language } from '@/context/language-context';

export default function Header() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/about', label: t('header.about') },
  ];

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
            </div>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
