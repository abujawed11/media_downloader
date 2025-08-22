import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const dimensions = {
  screenWidth: width,
  screenHeight: height,
  bubbleSize: 56,
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;
