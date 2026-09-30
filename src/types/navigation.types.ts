export type RootStackParamList = {
  Calendar: undefined;
  Task: {
    selectedDateString?: string;
  } | undefined;
};

export type NavigateKey = keyof RootStackParamList;
