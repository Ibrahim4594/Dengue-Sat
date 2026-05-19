// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force tslib to resolve to its CJS entry — framer-motion (used by Moti on web)
// imports tslib via its ESM modules/index.js which destructures `tslib.default`
// and breaks under Metro. Aliasing to the CJS build fixes the web bundle.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  tslib: path.resolve(__dirname, 'node_modules/tslib/tslib.js'),
};

module.exports = config;
