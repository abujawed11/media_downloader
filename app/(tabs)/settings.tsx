import { Text, View } from "react-native";
import { API_URL } from "../../src/config/env";

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-black px-4 pt-16">
      <Text className="text-white text-xl font-semibold">Settings</Text>
      <Text className="text-gray-300 mt-4">Backend URL: {API_URL}</Text>
    </View>
  );
}
