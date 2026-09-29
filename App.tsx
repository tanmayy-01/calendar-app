
import AppNavigation from '@/navigation/AppNavigation'
import { navigationRef } from '@/utils'
import { CALENDAR_COLORS } from '@/constants'
import { NavigationContainer } from '@react-navigation/native'
import React from 'react'
import { StatusBar, StyleSheet } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

const App = () => {
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