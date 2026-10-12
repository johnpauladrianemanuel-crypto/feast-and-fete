export type DeliveryMethod = 'delivery' | 'pickup';

export const PICKUP_ORDER_STATUSES: string[] = ['Pending', 'Confirmed', 'Preparing', 'Ready'];

const DELIVERY_ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready',
  'Shipped',
  'Completed',
];

const TERMINAL_ORDER_STATUSES = ['Completed', 'Cancelled'];

export function appendCancellationReason(notes: string | null, reason: string): string {
  const existingNotes = notes?.trim();
  const cancellationNote = `[Cancellation Reason]: ${reason.trim()}`;
  return existingNotes ? `${existingNotes}\n\n${cancellationNote}` : cancellationNote;
}

export function getCancellationReason(notes: string | null): string | undefined {
  if (!notes) return undefined;

  const match = notes.match(/(?:^|\n)(?:\[Cancellation Reason\]:|Cancelled:)\s*([\s\S]*)$/i);
  return match?.[1].trim() || undefined;
}

const NEXT_ORDER_STATUS: Record<string, string> = {
  Pending: 'Confirmed',
  Confirmed: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Shipped',
  Shipped: 'Completed',
};

export function getOrderStatusLabel(deliveryMethod: DeliveryMethod, status: string): string {
  if (deliveryMethod === 'pickup') {
    if (status === 'Preparing') return 'Kitchen';
    if (status === 'Ready') return 'Ready for Pickup';
    if (status === 'Shipped') return 'Ready for Pickup';
  }
  return status;
}

export function getOrderWorkflowStatus(deliveryMethod: DeliveryMethod, status: string): string {
  if (deliveryMethod === 'pickup' && status.toLowerCase() === 'shipped') return 'Ready';
  return status;
}

export function getNextOrderStatus(
  deliveryMethod: DeliveryMethod,
  currentStatus: string
): string | undefined {
  if (deliveryMethod === 'pickup') {
    const currentIndex = PICKUP_ORDER_STATUSES.indexOf(currentStatus);
    return currentIndex >= 0 ? PICKUP_ORDER_STATUSES[currentIndex + 1] : undefined;
  }
  return NEXT_ORDER_STATUS[currentStatus];
}

export function getAvailableOrderStatuses(
  deliveryMethod: DeliveryMethod,
  currentStatus: string,
  allStatuses: readonly string[]
): string[] {
  if (TERMINAL_ORDER_STATUSES.includes(currentStatus)) return [currentStatus];

  if (deliveryMethod === 'pickup') {
    const nextStatus = getNextOrderStatus(deliveryMethod, currentStatus);
    const correctedLegacyStatus = currentStatus.toLowerCase() === 'shipped' ? ['Ready'] : [];
    return Array.from(
      new Set([
        currentStatus,
        ...correctedLegacyStatus,
        ...(nextStatus ? [nextStatus] : []),
        'Cancelled',
      ])
    );
  }

  const currentIndex = DELIVERY_ORDER_STATUSES.indexOf(currentStatus);
  if (currentIndex === -1) return [currentStatus, 'Cancelled'];

  return [
    ...allStatuses.filter((status) => {
      const statusIndex = DELIVERY_ORDER_STATUSES.indexOf(status);
      return statusIndex >= currentIndex;
    }),
    'Cancelled',
  ];
}
