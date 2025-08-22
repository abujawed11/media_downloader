const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro configuration with NativeWind support
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

module.exports = withNativeWind(
  mergeConfig(getDefaultConfig(__dirname), config),
  { input: './global.css' } // 👈 tells NativeWind where your Tailwind CSS lives
);
