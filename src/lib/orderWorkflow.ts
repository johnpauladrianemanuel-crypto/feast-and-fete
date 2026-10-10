export type DeliveryMethod = 'delivery' | 'pickup';

export const PICKUP_ORDER_STATUSES: string[] = ['Pending', 'Confirmed', 'Preparing', 'Ready'];

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
  if (deliveryMethod !== 'pickup') return [...allStatuses];

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
