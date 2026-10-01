import { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  Calendar: undefined;
  Task: {
    selectedDateString?: string;
    prefilledTime?: string;
  } | undefined;
};

export type NavigateKey = keyof RootStackParamList;
export type TaskScreenRouteProp = RouteProp<RootStackParamList, 'Task'>;
