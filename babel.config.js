// module.exports = function (api) {
//     api.cache(true);
//     return {
//       presets: ["babel-preset-expo"],
//       plugins: [
//         [
//           "module:react-native-dotenv",
//           {
//             moduleName: "@env",
//             path: ".env",
//             safe: false,        // optional, true if you want to enforce .env.example check
//             allowUndefined: true // optional, avoids errors if a variable is missing
//           },
//         ],
//       ],
//     };
//   };
  

// module.exports = function (api) {
//   api.cache(true);
//   return {
//     presets: ["babel-preset-expo"],
//     plugins: ['react-native-reanimated/plugin'],
//   };
// };

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          safe: false,
          allowUndefined: true,
        },
      ],
      'react-native-reanimated/plugin', // MUST be last
    ],
  };
};