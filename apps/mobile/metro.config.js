const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Tell Metro to prefer browser versions of packages
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add polyfills for Node.js built-ins
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force axios to use browser build
  if (moduleName === 'axios') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('axios/dist/browser/axios.cjs'),
    };
  }
  
  // Handle Node.js built-ins that aren't in React Native
  const emptyModules = ['crypto', 'http2', 'fs', 'net', 'child_process', 'dgram'];
  if (emptyModules.includes(moduleName)) {
    return { type: 'empty' };
  }
  
  if (moduleName === 'url') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('url/url.js'),
    };
  }
  if (moduleName === 'http') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('stream-http/index.js'),
    };
  }
  if (moduleName === 'https') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('https-browserify/index.js'),
    };
  }
  if (moduleName === 'stream') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('readable-stream/readable.js'),
    };
  }
  if (moduleName === 'path') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('path-browserify/index.js'),
    };
  }
  if (moduleName === 'os') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('os-browserify/browser.js'),
    };
  }
  if (moduleName === 'zlib') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('pako/index.js'),
    };
  }
  if (moduleName === 'util') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('util/util.js'),
    };
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
