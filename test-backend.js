/**
 * Automated Test Suite for FIXLOOP Backend & SQLite DB
 */

const { app, server } = require('./server');
const http = require('node:http');

async function runTests() {
  console.log('--- Starting FIXLOOP Backend & Database Tests ---');

  const BASE_URL = 'http://localhost:3000';

  async function api(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const text = await res.text();
    try {
      return { status: res.status, data: JSON.parse(text) };
    } catch {
      return { status: res.status, data: text };
    }
  }

  try {
    // 1. Health check
    const health = await api('/api/health');
    console.log('✓ /api/health returned:', health.data.status, health.data.database);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Stats
    const stats = await api('/api/stats');
    console.log('✓ /api/stats returned:', stats.data);
    if (stats.data.total < 6) throw new Error('Seeded issues missing');

    // 3. Issues list
    const issues = await api('/api/issues');
    console.log('✓ /api/issues returned count:', issues.data.length);
    const fl1001 = issues.data.find(i => i.id === 'FL1001');
    console.log('✓ FL1001 priority score:', fl1001.priorityScore, '(Expected: 53)');
    if (fl1001.priorityScore !== 53) throw new Error('Priority score calculation mismatch');

    // 4. Duplicate Merge Test (Streetlight on Library Road)
    console.log('\n--- Testing Duplicate Merge ---');
    const dupRes = await api('/api/issues', {
      method: 'POST',
      body: JSON.stringify({
        reporterName: 'Priya Sharma (Hostel 3)',
        category: 'Streetlight',
        location: 'Library Road',
        title: 'Dark streetlight near library',
        description: 'Road is completely pitch black',
        severity: 'High',
        daysPending: 4
      })
    });
    console.log('✓ Duplicate merge response:', dupRes.data.isDuplicate, dupRes.data.message);
    if (!dupRes.data.isDuplicate) throw new Error('Failed to detect duplicate!');
    if (dupRes.data.issue.supports !== 6) throw new Error('Support count not incremented');
    if (dupRes.data.issue.priorityScore !== 56) throw new Error('Priority score not updated to 56');

    // 5. Verification Lifecycle Journey for FL1001
    console.log('\n--- Testing Full Lifecycle: FL1001 ---');
    
    // 5a. Acknowledge
    const ackRes = await api('/api/issues/FL1001/acknowledge', { method: 'POST' });
    console.log('✓ Acknowledged status:', ackRes.data.status);
    if (ackRes.data.status !== 'Acknowledged') throw new Error('Acknowledge failed');

    // 5b. Start Action
    const actRes = await api('/api/issues/FL1001/start-action', { method: 'POST' });
    console.log('✓ Action started status:', actRes.data.status);
    if (actRes.data.status !== 'In Progress') throw new Error('Start action failed');

    // 5c. Mark as Fixed
    const fixRes = await api('/api/issues/FL1001/mark-fixed', {
      method: 'POST',
      body: JSON.stringify({
        workNote: 'Replaced ballast and high-output LED fixture',
        actor: 'Electrician Team #2'
      })
    });
    console.log('✓ Marked as fixed status:', fixRes.data.status);
    if (fixRes.data.status !== 'Verification Pending') throw new Error('Status must be Verification Pending!');

    // 5d. Verification 1 of 2
    const v1Res = await api('/api/issues/FL1001/verify', {
      method: 'POST',
      body: JSON.stringify({
        voterName: 'Ananya Das (Student Council)',
        note: 'Checked at 8 PM, light is on'
      })
    });
    console.log('✓ Verification 1 status:', v1Res.data.status, 'Votes:', v1Res.data.verifyCount);
    if (v1Res.data.status !== 'Verification Pending' || v1Res.data.verifyCount !== 1) {
      throw new Error('Verification 1 should leave status as Verification Pending with count 1');
    }

    // 5e. Verification 2 of 2 -> Should become Verified Resolved!
    const v2Res = await api('/api/issues/FL1001/verify', {
      method: 'POST',
      body: JSON.stringify({
        voterName: 'Vikram Joshi (Resident Student)',
        note: 'Confirmed illuminated properly'
      })
    });
    console.log('✓ Verification 2 status:', v2Res.data.status, 'Votes:', v2Res.data.verifyCount);
    if (v2Res.data.status !== 'Verified Resolved' || v2Res.data.verifyCount !== 2) {
      throw new Error('Verification 2 must set status to Verified Resolved!');
    }

    // 6. Test Challenge on FL1003 (Water tap)
    console.log('\n--- Testing Challenge Mechanism: FL1003 ---');
    // First mark FL1003 fixed
    await api('/api/issues/FL1003/mark-fixed', {
      method: 'POST',
      body: JSON.stringify({ workNote: 'Tightened brass fitting' })
    });
    // Now challenge it
    const challRes = await api('/api/issues/FL1003/challenge', {
      method: 'POST',
      body: JSON.stringify({
        challengerName: 'Hostel Resident Amit',
        reason: 'Water is still dripping onto the floor'
      })
    });
    console.log('✓ Challenged status:', challRes.data.status, 'Challenged flag:', challRes.data.challenged);
    if (challRes.data.status !== 'In Progress' || !challRes.data.challenged) {
      throw new Error('Challenge must revert issue to In Progress and set challenged flag');
    }

    // 7. Reset Demo Data
    console.log('\n--- Testing Reset Demo Data ---');
    const resetRes = await api('/api/reset-demo', { method: 'POST' });
    console.log('✓ Reset response:', resetRes.data.message);
    const resetList = await api('/api/issues');
    const resetFL1001 = resetList.data.find(i => i.id === 'FL1001');
    console.log('✓ FL1001 status restored to:', resetFL1001.status, 'Supports:', resetFL1001.supports);
    if (resetFL1001.status !== 'Reported' || resetFL1001.supports !== 5) {
      throw new Error('Reset demo data did not restore initial state');
    }

    console.log('\n=============================================');
    console.log(' ALL BACKEND & DATABASE TESTS PASSED 100%! ');
    console.log('=============================================\n');

  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

// Give server time to bind and run tests
setTimeout(runTests, 500);
