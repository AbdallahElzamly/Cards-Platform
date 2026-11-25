/**
 * Automated Verification Script for Loyalty MVP (Task P26)
 * Runs natively on Node 22/24: `node scripts/verify-loyalty.ts`
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';

process.env.LOYALTY_PEPPER =
  process.env.LOYALTY_PEPPER ||
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function loadServerCryptoModule() {
  const filePath = path.resolve(process.cwd(), 'lib/loyalty-crypto.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const modExports: Record<string, unknown> = {};
  const mod = { exports: modExports };
  const customRequire = (id: string) => {
    if (id === 'server-only') return {};
    if (id === 'crypto' || id === 'node:crypto') return crypto;
    throw new Error(`Unexpected module import in loyalty-crypto: ${id}`);
  };

  const wrapper = vm.runInThisContext(
    `(function(exports, require, module, __filename, __dirname) { ${transpiled}\n})`
  );
  wrapper(modExports, customRequire, mod, filePath, path.dirname(filePath));
  return mod.exports as typeof import('../lib/loyalty-crypto');
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runVerification() {
  console.log('🚀 Starting Loyalty MVP Smoke Tests & Security Verification...\n');

  const {
    normalizeEgyptianPhone,
    normalizePinDigits,
    hashPhone,
    hashDailyPin,
    verifyDailyPin,
    signLoyaltySession,
    verifyLoyaltySession,
    generateRandomPin,
    generateVoucherCode,
  } = loadServerCryptoModule();

  // 1. Phone Normalization (Western, International, Arabic-Indic)
  const phone1 = normalizeEgyptianPhone('01030174729');
  const phone2 = normalizeEgyptianPhone('+201030174729');
  const phone3 = normalizeEgyptianPhone('٠١٠٣٠١٧٤٧٢٩');
  const phone4 = normalizeEgyptianPhone('201030174729');
  const phoneInvalid = normalizeEgyptianPhone('014729');

  assert(phone1 === '+201030174729', 'Normalizes local 010 number');
  assert(phone2 === '+201030174729', 'Normalizes +20 international number');
  assert(phone3 === '+201030174729', 'Normalizes Arabic-Indic numerals (٠-٩)');
  assert(phone4 === '+201030174729', 'Normalizes 201... number');
  assert(phoneInvalid === null, 'Rejects incomplete 6-digit phone fragments');

  // 2. Identical HMAC Phone Hash across formats
  assert(
    hashPhone(phone1!) === hashPhone(phone3!) && hashPhone(phone1!).length === 64,
    'Arabic-Indic and ASCII phone inputs produce identical 64-char HMAC-SHA256 hash'
  );

  // 3. Arabic-Indic PIN normalization + constant-time verification
  const programId = 'prog-test-uuid-1234';
  const pinHash = hashDailyPin('4829', programId);
  assert(normalizePinDigits('٤٨٢٩') === '4829', 'Converts Arabic-Indic PIN digits');
  assert(verifyDailyPin('4829', programId, pinHash) === true, 'Verifies valid PIN');
  assert(verifyDailyPin('٤٨٢٩', programId, pinHash) === true, 'Verifies Arabic-Indic PIN');
  assert(verifyDailyPin('0000', programId, pinHash) === false, 'Rejects invalid PIN');

  // 4. Signed Session Cookie & Tamper Detection
  const token = signLoyaltySession({ memberId: 'member-uuid-9999', programId });
  const verified = verifyLoyaltySession(token);
  assert(
    verified?.memberId === 'member-uuid-9999' && verified?.programId === programId,
    'Verifies authentic HMAC session cookie'
  );

  const [payloadPart, sigPart] = token.split('.');
  const flippedChar = sigPart[0] === 'a' ? 'b' : 'a';
  const tampered = `${payloadPart}.${flippedChar}${sigPart.slice(1)}`;
  assert(verifyLoyaltySession(tampered) === null, 'Rejects 1-char tampered session cookie');

  // 5. Random PIN & Voucher Generators
  assert(/^\d{4}$/.test(generateRandomPin()), 'Generates 4-digit random PIN');
  assert(/^FREE-\d{4}$/.test(generateVoucherCode()), 'Generates FREE-XXXX voucher code');

  console.log('\n🎉 ALL 14 LOYALTY CRYPTO & SECURITY SMOKE TESTS PASSED!');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
