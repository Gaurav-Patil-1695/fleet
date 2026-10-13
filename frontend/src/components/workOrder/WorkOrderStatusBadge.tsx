import React from 'react';
import Badge from '../ui/Badge';
import type { WorkOrder } from '../../types/workOrder';

interface WorkOrderStatusBadgeProps {
  status: WorkOrder['status'];
}

const STATUS_CONFIG: Record<
  WorkOrder['status'],
  { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; icon: string }
> = {
  open: {
    label: 'Open',
    variant: 'info',
    icon: '○',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'warning',
    icon: '◑',
  },
  closed: {
    label: 'Closed',
    variant: 'success',
    icon: '●',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'neutral',
    icon: '✕',
  },
};

const WorkOrderStatusBadge: React.FC<WorkOrderStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant}>
      <span
        aria-hidden="true"
        style={{
          marginRight: 'var(--space-1)',
          fontSize: 'var(--font-size-caption)',
          lineHeight: 1,
        }}
      >
        {config.icon}
      </span>
      {config.label}
    </Badge>
  );
};

export default WorkOrderStatusBadge;
