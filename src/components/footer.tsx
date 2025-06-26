import { useLanguage } from "@/context/language-context";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
        <p>{t('footer.copyright')}</p>
        <p className="text-sm mt-1">{t('footer.tagline')}</p>
      </div>
    </footer>
  );
}
