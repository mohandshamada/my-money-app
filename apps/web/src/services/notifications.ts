import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';

// Deep link handling
export function setupDeepLinks() {
  App.addListener('appUrlOpen', (data) => {
    const url = new URL(data.url);
    const path = url.pathname;
    const params = url.searchParams;
    
    // Handle different deep link paths
    switch (path) {
      case '/verify-email':
        // Email verification
        const token = params.get('token');
        const email = params.get('email');
        if (token && email) {
          window.location.href = `/verify-email?token=${token}&email=${email}`;
        }
        break;
        
      case '/reset-password':
        // Password reset
        const resetToken = params.get('token');
        if (resetToken) {
          window.location.href = `/reset-password?token=${resetToken}`;
        }
        break;
        
      case '/transaction':
        // Open specific transaction
        const txId = params.get('id');
        if (txId) {
          window.location.href = `/transactions?id=${txId}`;
        }
        break;
        
      case '/budget-alert':
        // Budget overspending alert
        const budgetId = params.get('budgetId');
        window.location.href = `/budgets${budgetId ? `?alert=${budgetId}` : ''}`;
        break;
        
      default:
        // Default: navigate to the path
        window.location.href = path;
    }
  });
}

// Notification types
export type NotificationType = 
  | 'budget_alert' 
  | 'transaction_reminder' 
  | 'subscription_renewal' 
  | 'weekly_report';

interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
}

// Schedule local notification
export async function scheduleNotification(
  payload: NotificationPayload,
  schedule: { at?: Date; every?: 'day' | 'week' | 'month' }
): Promise<string> {
  const notification = await LocalNotifications.schedule({
    notifications: [{
      id: Math.floor(Math.random() * 100000),
      title: payload.title,
      body: payload.body,
      schedule: schedule.at ? { at: schedule.at } : undefined,
      extra: payload.data,
      sound: 'default',
      smallIcon: 'ic_stat_icon',
      iconColor: '#4F46E5'
    }]
  });
  
  return notification.notifications[0]?.id?.toString() || '';
}

// Cancel notification
export async function cancelNotification(id: string): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: parseInt(id) }] });
}

// Request notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

// Check notification permission
export async function checkNotificationPermission(): Promise<boolean> {
  const result = await LocalNotifications.checkPermissions();
  return result.display === 'granted';
}

// Setup notification listeners
export function setupNotificationListeners() {
  // Handle when notification is tapped
  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    const data = notification.notification.extra;
    
    if (data?.type === 'budget_alert' && data?.budgetId) {
      window.location.href = `/budgets?alert=${data.budgetId}`;
    } else if (data?.type === 'transaction_reminder') {
      window.location.href = '/transactions?add=true';
    } else if (data?.type === 'subscription_renewal' && data?.subscriptionId) {
      window.location.href = `/subscriptions?id=${data.subscriptionId}`;
    } else {
      window.location.href = '/dashboard';
    }
  });
}

// Schedule budget alert notification
export async function scheduleBudgetAlert(
  budgetName: string,
  percentage: number,
  budgetId: string
): Promise<string> {
  return scheduleNotification({
    title: '💰 Budget Alert',
    body: `You've used ${percentage}% of your ${budgetName} budget!`,
    type: 'budget_alert',
    data: { type: 'budget_alert', budgetId }
  }, { at: new Date(Date.now() + 1000) }); // Show immediately
}

// Schedule weekly report
export async function scheduleWeeklyReport(): Promise<string> {
  // Schedule for next Sunday at 9 AM
  const nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
  nextSunday.setHours(9, 0, 0, 0);
  
  return scheduleNotification({
    title: '📊 Weekly Spending Report',
    body: 'Your weekly financial summary is ready. Tap to view.',
    type: 'weekly_report'
  }, { at: nextSunday });
}
