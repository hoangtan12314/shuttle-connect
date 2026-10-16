import type { RequestItemResponse } from '@shuttle-connect/types';
import type React from 'react';
import { RequestStatusBadge } from './RequestStatusBadge';

export function RequestRow({
  request,
  action,
}: {
  request: RequestItemResponse;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-border flex items-center justify-between gap-4 border-b px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{request.user.name}</span>
        <span className="text-muted-foreground text-sm">
          {request.user.skillLevel}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <RequestStatusBadge status={request.status} />
        {action}
      </div>
    </div>
  );
}
