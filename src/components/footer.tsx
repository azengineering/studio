
'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from "@/context/language-context";
import Link from 'next/link';
import { getSiteSettings, type SiteSettings } from '@/data/settings';
import { Twitter, Linkedin, Youtube, Facebook } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});

  useEffect(() => {
    const fetchSettings = async () => {
        const fetchedSettings = await getSiteSettings();
        setSettings(fetchedSettings);
    };
    fetchSettings();
  }, []);

  return (
    <footer className="border-t">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
        <div className="flex justify-center gap-4 text-sm mb-4">
          <Link href="/contact" className="hover:text-primary transition-colors">{t('contactPage.link')}</Link>
        </div>
        
        <div className="flex justify-center gap-6 my-4">
            {settings.contact_twitter && (
                <a href={settings.contact_twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Twitter className="h-5 w-5" />
                    <span className="sr-only">X/Twitter</span>
                </a>
            )}
             {settings.contact_linkedin && (
                <a href={settings.contact_linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-5 w-5" />
                    <span className="sr-only">LinkedIn</span>
                </a>
            )}
            {settings.contact_youtube && (
                <a href={settings.contact_youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Youtube className="h-5 w-5" />
                     <span className="sr-only">YouTube</span>
                </a>
            )}
            {settings.contact_facebook && (
                <a href={settings.contact_facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Facebook className="h-5 w-5" />
                     <span className="sr-only">Facebook</span>
                </a>
            )}
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
