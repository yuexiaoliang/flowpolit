import { Sparkle } from '@phosphor-icons/react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={'brand ' + (compact ? 'compact' : '')}>
      <span className="brand-mark">
        <Sparkle size={16} weight="fill" />
      </span>
      <span>Flow Pilot</span>
    </span>
  );
}
