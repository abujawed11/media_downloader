// app/_layout.tsx
import { Slot } from 'expo-router';
import { StatusBar, View } from 'react-native';
// import "../src/theme/tailwind.css";
import "../global.css";

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar barStyle="light-content" />
      <Slot />
    </View>
  );
}
