import { View } from "react-native";

export default function ProgressBar({ progress = 0 }: { progress?: number }) {
  return (
    <View className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
      <View className="h-2 bg-brand-yellow" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
    </View>
  );
}
