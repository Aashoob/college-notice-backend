const { Expo } = require('expo-server-sdk');

console.log('=== Testing expo-server-sdk ===');
console.log('1. Can import?', typeof Expo !== 'undefined' ? '✅ YES' : '❌ NO');

const expo = new Expo();
console.log('2. Can create instance?', expo ? '✅ YES' : '❌ NO');

console.log('3. Token validation function exists?', 
  typeof Expo.isExpoPushToken === 'function' ? '✅ YES' : '❌ NO');

// Test a fake token
const fakeToken = 'ExponentPushToken[ThisIsATestToken123]';
console.log('4. Token validation test:', 
  Expo.isExpoPushToken(fakeToken) ? '✅ Works' : '❌ Fails');

console.log('\n🎯 If all ✅, expo-server-sdk is ready!');