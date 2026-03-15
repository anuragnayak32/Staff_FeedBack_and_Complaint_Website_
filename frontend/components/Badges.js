import { cn, STATUS_COLORS, SEVERITY_COLORS } from '@/lib/utils';

export function StatusBadge({ status }) {
  return (
    <span className={cn('status-badge', STATUS_COLORS[status] || 'bg-gray-100 text-gray-700')}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  return (
    <span className={cn('status-badge', SEVERITY_COLORS[severity] || 'bg-gray-100 text-gray-700')}>
      {severity}
    </span>
  );
}
