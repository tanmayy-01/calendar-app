/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Background event handler for @notifee/react-native
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('[Notifee] Background notification pressed:', detail.notification?.id);
  }
});

AppRegistry.registerComponent(appName, () => App);
