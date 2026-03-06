import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();
let pendingHistoryNavigation = false;

export function navigateToHistory() {
  if (!navigationRef.isReady()) {
    pendingHistoryNavigation = true;
    return;
  }

  pendingHistoryNavigation = false;
  (navigationRef as any).navigate('Main', { screen: 'History' });
}

export function flushPendingNavigation() {
  if (pendingHistoryNavigation && navigationRef.isReady()) {
    pendingHistoryNavigation = false;
    (navigationRef as any).navigate('Main', { screen: 'History' });
  }
}
