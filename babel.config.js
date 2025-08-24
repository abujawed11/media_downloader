// // babel.config.js
// module.exports = function (api) {
//   api.cache(true);
//   return {
//     presets: ['babel-preset-expo'],
//     plugins: [
//       // Order among these two is fine, but Reanimated MUST be last overall
//       'expo-router/babel',
//       'nativewind/babel',

//       // Always keep this LAST in the list
//       'react-native-reanimated/plugin',
//     ],
//   };
// };


module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin", // This must be the last plugin
    ],
  };
};

