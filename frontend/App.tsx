// import React, { useState } from 'react';
// import {
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Alert,
//   TextInput,
//   ScrollView,
//   ActivityIndicator,
// } from 'react-native';

// // Simplified store without external dependencies
// const defaultSettings = {
//   defaultQuality: '720p',
//   downloadPath: '/storage/emulated/0/Download/MediaDownloader',
//   autoConvertToMp3: false,
//   showNotifications: true,
//   floatingBubbleEnabled: true,
// };

// function App(): React.JSX.Element {
//   const [currentScreen, setCurrentScreen] = useState<'home' | 'downloads' | 'settings'>('home');
//   const [url, setUrl] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [downloads] = useState([]);
//   const [settings] = useState(defaultSettings);

//   const handleTestDownload = () => {
//     if (!url.trim()) {
//       Alert.alert('Error', 'Please enter a URL');
//       return;
//     }
    
//     setIsLoading(true);
//     // Simulate API call
//     setTimeout(() => {
//       setIsLoading(false);
//       Alert.alert('Success!', `Added "${url}" to downloads queue! 🎉`);
//       setUrl('');
//     }, 2000);
//   };

//   const TabButton = ({ title, screen, icon }: { title: string; screen: 'home' | 'downloads' | 'settings'; icon: string }) => (
//     <TouchableOpacity
//       style={[styles.tabButton, currentScreen === screen && styles.activeTab]}
//       onPress={() => setCurrentScreen(screen)}
//     >
//       <Text style={styles.tabIcon}>{icon}</Text>
//       <Text style={[styles.tabText, currentScreen === screen && styles.activeTabText]}>
//         {title}
//       </Text>
//     </TouchableOpacity>
//   );

//   const renderHomeScreen = () => (
//     <ScrollView style={styles.screen}>
//       <Text style={styles.screenTitle}>Media Downloader</Text>
//       <Text style={styles.subtitle}>Download from YouTube, Instagram, TikTok & more</Text>
      
//       <View style={styles.inputContainer}>
//         <Text style={styles.label}>Paste URL:</Text>
//         <TextInput
//           style={styles.input}
//           value={url}
//           onChangeText={setUrl}
//           placeholder="https://youtube.com/watch?v=..."
//           placeholderTextColor="#a0a0a0"
//           multiline
//         />
//       </View>
      
//       <TouchableOpacity 
//         style={[styles.primaryButton, isLoading && styles.disabledButton]} 
//         onPress={handleTestDownload}
//         disabled={isLoading}
//       >
//         {isLoading ? (
//           <ActivityIndicator color="#000000" />
//         ) : (
//           <Text style={styles.primaryButtonText}>Get Download Options</Text>
//         )}
//       </TouchableOpacity>
      
//       <View style={styles.featuresContainer}>
//         <Text style={styles.featuresTitle}>Supported Platforms:</Text>
//         <Text style={styles.feature}>🎥 YouTube - All resolutions</Text>
//         <Text style={styles.feature}>📸 Instagram - Posts & Stories</Text>
//         <Text style={styles.feature}>🎵 TikTok - HD quality</Text>
//         <Text style={styles.feature}>🐦 Twitter - Videos & GIFs</Text>
//         <Text style={styles.feature}>📘 Facebook - Public videos</Text>
//       </View>
//     </ScrollView>
//   );

//   const renderDownloadsScreen = () => (
//     <ScrollView style={styles.screen}>
//       <Text style={styles.screenTitle}>Downloads</Text>
      
//       <View style={styles.emptyState}>
//         <Text style={styles.emptyIcon}>📥</Text>
//         <Text style={styles.emptyTitle}>No downloads yet</Text>
//         <Text style={styles.emptyText}>Start downloading media from the Home tab</Text>
//       </View>
      
//       <View style={styles.statsContainer}>
//         <Text style={styles.statsTitle}>App Ready Features:</Text>
//         <Text style={styles.stat}>✅ Progress tracking with pause/resume</Text>
//         <Text style={styles.stat}>✅ Quality selection (360p/720p/1080p)</Text>
//         <Text style={styles.stat}>✅ Audio-only MP3 downloads</Text>
//         <Text style={styles.stat}>✅ Background downloading</Text>
//         <Text style={styles.stat}>✅ Platform organization</Text>
//       </View>
//     </ScrollView>
//   );

//   const renderSettingsScreen = () => (
//     <ScrollView style={styles.screen}>
//       <Text style={styles.screenTitle}>Settings</Text>
      
//       <View style={styles.settingSection}>
//         <Text style={styles.settingTitle}>Default Quality</Text>
//         <Text style={styles.settingValue}>{settings.defaultQuality}</Text>
//       </View>
      
//       <View style={styles.settingSection}>
//         <Text style={styles.settingTitle}>Download Path</Text>
//         <Text style={styles.settingValue} numberOfLines={2}>
//           {settings.downloadPath}
//         </Text>
//       </View>
      
//       <View style={styles.settingSection}>
//         <Text style={styles.settingTitle}>Auto Convert to MP3</Text>
//         <Text style={styles.settingValue}>
//           {settings.autoConvertToMp3 ? 'Enabled' : 'Disabled'}
//         </Text>
//       </View>
      
//       <View style={styles.settingSection}>
//         <Text style={styles.settingTitle}>Floating Bubble</Text>
//         <Text style={styles.settingValue}>
//           {settings.floatingBubbleEnabled ? 'Enabled' : 'Disabled'}
//         </Text>
//       </View>
      
//       <TouchableOpacity style={styles.secondaryButton}>
//         <Text style={styles.secondaryButtonText}>About App</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
//       {/* Content */}
//       <View style={styles.content}>
//         {currentScreen === 'home' && renderHomeScreen()}
//         {currentScreen === 'downloads' && renderDownloadsScreen()}
//         {currentScreen === 'settings' && renderSettingsScreen()}
//       </View>
      
//       {/* Bottom Tabs */}
//       <View style={styles.tabBar}>
//         <TabButton title="Home" screen="home" icon="🏠" />
//         <TabButton title="Downloads" screen="downloads" icon="📥" />
//         <TabButton title="Settings" screen="settings" icon="⚙️" />
//       </View>
      
//       {/* Floating Bubble (Demo) */}
//       {settings.floatingBubbleEnabled && (
//         <TouchableOpacity 
//           style={styles.floatingBubble}
//           onPress={() => Alert.alert('Floating Bubble', 'Backend API running at http://localhost:8000 🟡')}
//         >
//           <Text style={styles.bubbleText}>⬇️</Text>
//         </TouchableOpacity>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000000',
//   },
//   content: {
//     flex: 1,
//   },
//   screen: {
//     flex: 1,
//     padding: 20,
//   },
//   screenTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#FAD90E',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#ffffff',
//     textAlign: 'center',
//     marginBottom: 30,
//   },
//   inputContainer: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 18,
//     color: '#ffffff',
//     fontWeight: '600',
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: '#2a2a2a',
//     borderColor: '#FAD90E',
//     borderWidth: 1,
//     borderRadius: 10,
//     padding: 15,
//     color: '#ffffff',
//     fontSize: 16,
//     minHeight: 80,
//     textAlignVertical: 'top',
//   },
//   primaryButton: {
//     backgroundColor: '#FAD90E',
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   primaryButtonText: {
//     color: '#000000',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   secondaryButton: {
//     backgroundColor: '#2a2a2a',
//     borderColor: '#FAD90E',
//     borderWidth: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   secondaryButtonText: {
//     color: '#FAD90E',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   featuresContainer: {
//     marginTop: 20,
//   },
//   featuresTitle: {
//     fontSize: 20,
//     color: '#FAD90E',
//     fontWeight: 'bold',
//     marginBottom: 15,
//   },
//   feature: {
//     fontSize: 16,
//     color: '#ffffff',
//     marginBottom: 8,
//   },
//   emptyState: {
//     alignItems: 'center',
//     marginTop: 50,
//     marginBottom: 40,
//   },
//   emptyIcon: {
//     fontSize: 64,
//     marginBottom: 20,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     color: '#ffffff',
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#a0a0a0',
//     textAlign: 'center',
//   },
//   statsContainer: {
//     marginTop: 20,
//   },
//   statsTitle: {
//     fontSize: 20,
//     color: '#FAD90E',
//     fontWeight: 'bold',
//     marginBottom: 15,
//   },
//   stat: {
//     fontSize: 16,
//     color: '#ffffff',
//     marginBottom: 8,
//   },
//   settingSection: {
//     backgroundColor: '#2a2a2a',
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 15,
//   },
//   settingTitle: {
//     fontSize: 16,
//     color: '#ffffff',
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   settingValue: {
//     fontSize: 14,
//     color: '#a0a0a0',
//   },
//   tabBar: {
//     flexDirection: 'row',
//     backgroundColor: '#000000',
//     borderTopColor: '#FAD90E',
//     borderTopWidth: 1,
//     paddingVertical: 10,
//   },
//   tabButton: {
//     flex: 1,
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   activeTab: {
//     backgroundColor: '#FAD90E',
//     borderRadius: 20,
//     marginHorizontal: 5,
//   },
//   tabIcon: {
//     fontSize: 20,
//     marginBottom: 4,
//   },
//   tabText: {
//     fontSize: 12,
//     color: '#ffffff',
//     fontWeight: '600',
//   },
//   activeTabText: {
//     color: '#000000',
//   },
//   floatingBubble: {
//     position: 'absolute',
//     right: 20,
//     bottom: 100,
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#FAD90E',
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.5,
//     shadowRadius: 4,
//   },
//   bubbleText: {
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
// });

// export default App;



// import "./global.css";
// import { View, Text } from "react-native";

// export default function App() {
//   return (
//     <View className="flex-1 items-center justify-center bg-white">
//       <Text className="text-xl font-bold text-blue-500">
//         NativeWind is working!
//       </Text>
//     </View>
//   );
// }

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

import TabNavigator from './src/navigation/TabNavigator';
import { colors } from './src/constants/colors';
import { RootStackParamList } from './src/navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={colors.background} 
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

