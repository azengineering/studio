import { Scale } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold font-headline text-primary">PolitiRate</span>
          </Link>
          <nav>
            {/* Navigation links can go here */}
          </nav>
        </div>
      </div>
    </header>
  );
}
