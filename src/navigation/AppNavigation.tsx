import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREEN_NAMES } from '@/constants';
import Calendar from '@/screens/Calendar';
import Task from '@/screens/Task';


const Stack = createNativeStackNavigator();

interface AppNavigationProps {
  initialRoute?: typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];
}

const AppNavigation: React.FC<AppNavigationProps> = ({
  initialRoute = SCREEN_NAMES.CALENDAR,
}) => {
  return (
    <Stack.Navigator
      key={initialRoute}
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={SCREEN_NAMES.CALENDAR} component={Calendar} />
      <Stack.Screen name={SCREEN_NAMES.TASK} component={Task} />
    </Stack.Navigator>
  );
};

export default AppNavigation;