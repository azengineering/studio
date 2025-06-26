import { Scale } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="flex items-center gap-4 text-primary animate-pulse">
        <Scale className="w-16 h-16" />
        <h1 className="text-5xl font-headline font-bold">PolitiRate</h1>
      </div>
      <p className="mt-4 text-muted-foreground">Weighing the scales of democracy...</p>
    </div>
  );
}
