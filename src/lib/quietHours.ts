export function isQuietHoursActive(): boolean {
  try {
    const raw = localStorage.getItem('admin_notification_settings');
    if (!raw) return false;
    
    const parsed = JSON.parse(raw);
    const quietHours = parsed.quietHours;
    
    if (!quietHours || !quietHours.enabled) return false;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

    if (quietHours.days && !quietHours.days.includes(currentDay)) {
      return false;
    }

    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const { from, to } = quietHours;

    if (from > to) {
      return currentTimeStr >= from || currentTimeStr <= to;
    } else {
      return currentTimeStr >= from && currentTimeStr <= to;
    }
  } catch {
    return false;
  }
}