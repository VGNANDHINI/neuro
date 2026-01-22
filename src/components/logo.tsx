import Link from 'next/link';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center space-x-3', className)}>
      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent/80 rounded-lg flex items-center justify-center">
        <Brain className="w-6 h-6 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold font-headline text-foreground">
        NeuroTiva
      </span>
    </Link>
  );
}
