// Test: simulates a 3-turn fever conversation
const BASE = 'http://localhost:5003/api/chat';

async function post(body) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function main() {
  console.log('============================================');
  console.log('TURN 1: "i m having fever"');
  console.log('============================================');
  const r1 = await post({ message: 'i m having fever', language: 'en' });
  console.log(`Type: ${r1.type}`);
  console.log(`Response: ${r1.response}`);
  console.log(`SessionId: ${r1.sessionId}`);
  const sid = r1.sessionId;

  console.log('\n============================================');
  console.log('TURN 2: "yes sore throat"');
  console.log('============================================');
  const r2 = await post({ message: 'yes sore throat', language: 'en', sessionId: sid });
  console.log(`Type: ${r2.type}`);
  console.log(`Response: ${r2.response}`);

  console.log('\n============================================');
  console.log('TURN 3: "yes since 2 days" → MUST be guidance!');
  console.log('============================================');
  const r3 = await post({ message: 'yes since 2 days', language: 'en', sessionId: sid });
  console.log(`Type: ${r3.type}`);
  console.log(`Response: ${r3.response}`);
  console.log(`Hospitals: ${JSON.stringify(r3.hospitals?.map(h => h.name))}`);

  // Verify it's guidance not a question
  if (r3.type === 'guidance') {
    console.log('\n✅ SUCCESS: Turn 3 returned guidance (not another question)');
  } else {
    console.log('\n❌ FAIL: Turn 3 should be guidance but got:', r3.type);
  }

  console.log('\n============================================');
  console.log('TURN 4: Even if user keeps talking, still guidance');
  console.log('============================================');
  const r4 = await post({ message: 'what else should I do', language: 'en', sessionId: sid });
  console.log(`Type: ${r4.type}`);
  console.log(`Response: ${r4.response}`);

  console.log('\n✅ All turns complete!');
}

main().catch(err => console.error('Test failed:', err.message));
