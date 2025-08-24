// app/index.tsx
import { Redirect } from "expo-router";
export default function Index() {
  return <Redirect href="/(tabs)" />;
}


// import { Text, View } from "react-native";

// export default function Index() {
//   return (
//     <View style={{ flex: 1, backgroundColor: "black", alignItems: "center", justifyContent: "center" }}>
//       <Text style={{ color: "#FAD90E", fontSize: 22, fontWeight: "bold" }}>
//         Hello from /app/index.tsx ✅
//       </Text>
//     </View>
//   );
// }
