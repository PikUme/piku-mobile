import { Platform } from 'react-native';

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#0f172a',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 8,
      },
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
};
