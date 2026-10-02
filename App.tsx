
import AppNavigation from '@/navigation/AppNavigation'
import { navigationRef } from '@/utils'
import { CALENDAR_COLORS } from '@/constants'
import { NavigationContainer } from '@react-navigation/native'
import React, { useEffect } from 'react'
import { StatusBar, StyleSheet } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { initNotificationService, rescheduleUpcomingNotifications } from '@/services/notificationService'
import { loadTasks } from '@/services/taskStorage'
import { loadEvents } from '@/services/eventStorage'

const App = () => {
  useEffect(() => {
    const setupNotifications = async () => {
      await initNotificationService();
      try {
        const [tasks, events] = await Promise.all([loadTasks(), loadEvents()]);
        await rescheduleUpcomingNotifications(tasks, events);
      } catch (err) {
        console.warn(err);
      }
    };
    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <NavigationContainer ref={navigationRef}>
          <AppNavigation />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CALENDAR_COLORS.background,
  },
})

export default App