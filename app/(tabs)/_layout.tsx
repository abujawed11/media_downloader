import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { View } from "react-native";

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#FAD90E",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: { backgroundColor: "black", borderTopColor: "#222" },
          // add icons here
          tabBarIcon: ({ color, size, focused }) => {
            const map: Record<string, keyof typeof Ionicons.glyphMap> = {
              index: focused ? "home" : "home-outline",
              downloads: focused ? "download" : "download-outline",
              settings: focused ? "settings" : "settings-outline",
            };
            return <Ionicons name={map[route.name] || "ellipse-outline"} size={size} color={color} />;
          },
        })}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="downloads" options={{ title: "Downloads" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>
    </View>
  );
}
