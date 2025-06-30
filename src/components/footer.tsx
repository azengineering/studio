
'use client';
import { useLanguage } from "@/context/language-context";
import Link from 'next/link';
import { Separator } from "./ui/separator";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
        <div className="flex justify-center gap-4 text-sm mb-4">
          <Link href="/about" className="hover:text-primary transition-colors">{t('header.about')}</Link>
          <Separator orientation="vertical" className="h-5" />
          <Link href="/contact" className="hover:text-primary transition-colors">{t('contactPage.link')}</Link>
        </div>
        <p>
          {t('footer.copyright')}
          <Link href="/admin/login" className="ml-2 text-primary hover:underline" aria-label="Admin Panel">...</Link>
        </p>
        <p className="text-sm mt-1">{t('footer.tagline')}</p>
      </div>
    </footer>
  );
}
