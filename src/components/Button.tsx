import { Pressable, Text } from "react-native";

export default function Button({ title, onPress, disabled }: { title: string; onPress?: () => void; disabled?: boolean; }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="bg-brand-yellow rounded-2xl px-4 py-3 items-center"
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <Text className="text-black font-semibold">{title}</Text>
    </Pressable>
  );
}
