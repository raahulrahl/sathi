import { Check, Linkedin, Mail, MessageCircle, Twitter } from 'lucide-react';
import type { VerificationChannel } from '@/types/db';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ICONS: Record<VerificationChannel, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  twitter: Twitter,
  email: Mail,
  whatsapp: MessageCircle,
};

const LABELS: Record<VerificationChannel, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

export function VerifiedBadge({
  channel,
  className,
}: {
  channel: VerificationChannel;
  className?: string;
}) {
  const Icon = ICONS[channel];
  return (
    <Badge variant="success" className={cn('gap-1 pl-1.5', className)}>
      <Icon className="size-3" />
      <span>{LABELS[channel]}</span>
      <Check className="size-3" aria-hidden />
    </Badge>
  );
}

export function VerifiedBadgeCount({ count, className }: { count: number; className?: string }) {
  if (count <= 0) {
    return (
      <Badge variant="muted" className={className}>
        Not yet verified
      </Badge>
    );
  }
  return (
    <Badge variant="success" className={cn('gap-1', className)}>
      <Check className="size-3" />
      {count} of 3 verified
    </Badge>
  );
}
