/**
 * Automated Verification Script for Loyalty MVP (Task P26)
 * Tests core security, crypto, normalization, and session functions.
 */

import Module from 'module';

// Mock 'server-only' for standalone node script execution
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (this: any, id: string) {
  if (id === 'server-only') {
    return {};
  }
  return originalRequire.apply(this, arguments);
};

import {
  normalizeEgyptianPhone,
  hashPhone,
  hashDailyPin,
  verifyDailyPin,
  signLoyaltySession,
  verifyLoyaltySession,
  generateRandomPin,
  generateVoucherCode,
} from '../lib/loyalty-crypto';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runVerification() {
  console.log('🚀 Starting Loyalty MVP Smoke Tests & Verification (Task P26)...\n');

  // 1. Test Phone Normalization (Western, International, Arabic-Indic)
  const phone1 = normalizeEgyptianPhone('01030174729');
  const phone2 = normalizeEgyptianPhone('+201030174729');
  const phone3 = normalizeEgyptianPhone('٠١٠٣٠١٧٤٧٢٩');
  const phone4 = normalizeEgyptianPhone('201030174729');
  const phoneInvalid = normalizeEgyptianPhone('01234');

  assert(phone1 === '+201030174729', 'Normalizes local 010 number correctly');
  assert(phone2 === '+201030174729', 'Handles +20 international format correctly');
  assert(phone3 === '+201030174729', 'Normalizes Arabic-Indic numerals (٠-٩) correctly');
  assert(phone4 === '+201030174729', 'Handles 201... format without plus correctly');
  assert(phoneInvalid === null, 'Rejects invalid phone numbers');

  // 2. Test Phone Hashing
  const hash1 = hashPhone(phone1!);
  const hash2 = hashPhone(phone3!);
  assert(hash1 === hash2, 'Identical canonical phones produce identical phone hashes');
  assert(hash1.length === 64, 'Phone hash is valid SHA-256 hex digest (64 chars)');

  // 3. Test Daily PIN Hashing & Constant-time Verification
  const programId = 'prog-test-uuid-1234';
  const pin = '4829';
  const pinHash = hashDailyPin(pin, programId);

  assert(verifyDailyPin(pin, programId, pinHash) === true, 'Valid PIN verifies successfully');
  assert(verifyDailyPin('0000', programId, pinHash) === false, 'Invalid PIN is rejected');
  assert(verifyDailyPin('482', programId, pinHash) === false, 'Short PIN is rejected');

  // 4. Test Session Signing & Verification
  const sessionPayload = {
    memberId: 'member-uuid-9999',
    programId: programId,
  };
  const token = signLoyaltySession(sessionPayload);
  assert(typeof token === 'string' && token.includes('.'), 'Session token is signed and formatted correctly');

  const verifiedSession = verifyLoyaltySession(token);
  assert(verifiedSession !== null, 'Valid session token verifies successfully');
  assert(verifiedSession?.memberId === sessionPayload.memberId, 'Verified session retains correct member ID');
  assert(verifiedSession?.programId === sessionPayload.programId, 'Verified session retains correct program ID');

  // Test Tampered Token
  const [dataPart] = token.split('.');
  const tamperedToken = `${dataPart}.tampered_signature`;
  assert(verifyLoyaltySession(tamperedToken) === null, 'Tampered session signature is securely rejected');

  // 5. Test Random Generators
  const randomPin = generateRandomPin();
  assert(/^\d{4}$/.test(randomPin), 'Generated random PIN is exactly 4 digits');

  const voucherCode = generateVoucherCode();
  assert(/^FREE-\d{4}$/.test(voucherCode), 'Generated voucher code matches FREE-XXXX format');

  console.log('\n🎉 ALL LOYALTY MVP SMOKE TESTS PASSED SUCCESSFULLY!');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed with error:', err);
  process.exit(1);
});
