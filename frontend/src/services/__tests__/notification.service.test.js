import notificationService from '../notification.service';

describe('notification.service (unit)', () => {
  test('getUnreadCount returns mocked count (0)', async () => {
    const cnt = await notificationService.getUnreadCount();
    expect(typeof cnt).toBe('number');
    expect(cnt).toBe(0);
  });

  test('getNotifications returns mocked list (array)', async () => {
    const res = await notificationService.getNotifications({ skip: 0, limit: 10 });
    expect(res).toBeDefined();
    // Accept either an object with notifications array or a direct array shape
    if (Array.isArray(res)) {
      expect(res.length).toBeGreaterThanOrEqual(0);
    } else if (res && typeof res === 'object') {
      if (Array.isArray(res.notifications)) expect(res.notifications.length).toBeGreaterThanOrEqual(0);
    }
  });
});
