import { querySanityContext } from '../src/lib/mcp-bridge';

async function runVerification() {
  console.log(`\n======================================================`);
  console.log(` Running Quran Sanity Agent Grounding & MCP Verification`);
  console.log(`======================================================\n`);

  let allPassed = true;

  // Test 1: Basmalah Divergence (Contradictory)
  console.log(`[Test 1] Testing Basmalah in Al-Fatiha...`);
  const test1 = await querySanityContext({ query: 'Basmalah in Al-Fatiha', surahNumber: 1 });
  if (
    test1.found &&
    test1.divergenceGroups.length > 0 &&
    test1.divergenceGroups[0].divergenceType === 'contradictory' &&
    test1.divergenceGroups[0].claims.length >= 2
  ) {
    console.log(` ✓ PASS: Correctly detected CONTRADICTORY divergence with side-by-side scholar claims!`);
    console.log(`   Scholars: ${test1.divergenceGroups[0].claims.map(c => c.source?.author).join(' vs ')}`);
  } else {
    console.error(` ✗ FAIL: Test 1 failed!`);
    allPassed = false;
  }

  // Test 2: Al-Asr Semantic Scope (Complementary)
  console.log(`\n[Test 2] Testing Semantic Scope of Al-Asr...`);
  const test2 = await querySanityContext({ query: 'Al-Asr', surahNumber: 103 });
  if (
    test2.found &&
    test2.divergenceGroups.length > 0 &&
    test2.divergenceGroups[0].divergenceType === 'complementary'
  ) {
    console.log(` ✓ PASS: Correctly detected COMPLEMENTARY diversity (*Ikhtilaf Tanawwu*)!`);
  } else {
    console.error(` ✗ FAIL: Test 2 failed!`);
    allPassed = false;
  }

  // Test 3: Ayah al-Kursi Attributes (Consensus)
  console.log(`\n[Test 3] Testing Divine Attributes in Ayah al-Kursi...`);
  const test3 = await querySanityContext({ query: 'Al-Hayy Al-Qayyum', surahNumber: 2 });
  if (
    test3.found &&
    test3.divergenceGroups.length > 0 &&
    test3.divergenceGroups[0].divergenceType === 'consensus'
  ) {
    console.log(` ✓ PASS: Correctly detected SCHOLARLY CONSENSUS (*Ijma*)!`);
  } else {
    console.error(` ✗ FAIL: Test 3 failed!`);
    allPassed = false;
  }

  // Test 4: Unindexed Anti-Hallucination Policy
  console.log(`\n[Test 4] Testing Unindexed Fallback Refusal (Surah Al-Kahf)...`);
  const test4 = await querySanityContext({ query: 'Surah Al-Kahf cave story', surahNumber: 18 });
  if (!test4.found && test4.citations.length === 0) {
    console.log(` ✓ PASS: Correctly refused unindexed query with zero hallucinations!`);
  } else {
    console.error(` ✗ FAIL: Test 4 failed!`);
    allPassed = false;
  }

  console.log(`\n------------------------------------------------------`);
  if (allPassed) {
    console.log(`✓ ALL 4 RIGOROUS VERIFICATION TESTS PASSED PERFECTLY!\n`);
  } else {
    console.error(`✗ Some tests failed.\n`);
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
