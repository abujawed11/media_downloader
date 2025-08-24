import { useRef, useState } from "react";
import { Animated, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & { label: string };

export default function FloatingInput({ label, value, onChangeText, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  function animate(to: number) {
    Animated.timing(anim, { toValue: to, duration: 140, useNativeDriver: false }).start();
  }

  const top = anim.interpolate({ inputRange: [0, 1], outputRange: [16, -8] });
  const fontSize = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] });

  return (
    <View className="w-full my-4">
      <Animated.Text style={{ top, fontSize }} className="absolute left-3 text-white">
        {label}
      </Animated.Text>
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => { setFocused(true); animate(1); }}
        onBlur={() => { setFocused(false); if (!value) animate(0); }}
        className="border border-brand-yellow rounded-xl px-3 pt-5 pb-2 text-white"
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}
