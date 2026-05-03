const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .mjs files which socket.io-client uses
config.resolver.sourceExts.push('mjs');

module.exports = config;
