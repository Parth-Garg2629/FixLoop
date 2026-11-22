/**
 * FIXLOOP — SQLite Database Layer
 * Uses Node.js native DatabaseSync (node:sqlite) for high-performance,
 * zero-dependency relational persistence.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Path to SQLite database file
const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_FILE = path.join(DB_DIR, 'fixloop.db');

const db = new DatabaseSync(DB_FILE);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Calculates priority score:
 * Severity points (Low=10, Medium=20, High=30) + (Supports * 3) + (Days Pending * 2)
 */
function calculatePriorityScore(severity, supports, daysPending) {
  let sevPoints = 20;
  if (severity === 'High') sevPoints = 30;
  else if (severity === 'Low') sevPoints = 10;

  const supPoints = (Number(supports) || 0) * 3;
  const dayPoints = (Number(daysPending) || 0) * 2;
  return sevPoints + supPoints + dayPoints;
}

/**
 * Initialize Tables
 */
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('Low', 'Medium', 'High')),
      days_pending INTEGER NOT NULL DEFAULT 0,
      supports INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Reported' CHECK(status IN ('Reported', 'Acknowledged', 'In Progress', 'Verification Pending', 'Verified Resolved')),
      before_label TEXT,
      before_image TEXT,
      after_label TEXT,
      after_image TEXT,
      verify_count INTEGER NOT NULL DEFAULT 0,
      challenged INTEGER NOT NULL DEFAULT 0,
      challenged_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS updates (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL,
      status TEXT NOT NULL,
      badge TEXT,
      remark TEXT NOT NULL,
      actor TEXT,
      time_label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL,
      decision TEXT NOT NULL CHECK(decision IN ('verify', 'challenge')),
      voter_name TEXT NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS volunteers (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_issues_cat_loc ON issues(category, location);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
  `);

  // Check if we need to seed
  const countRow = db.prepare('SELECT COUNT(*) as count FROM issues').get();
  if (countRow.count === 0) {
    seedDatabase();
  }
}

/**
 * Seed initial 6 campus issues
 */
function seedDatabase() {
  const insertIssue = db.prepare(`
    INSERT INTO issues (id, title, category, description, location, severity, days_pending, supports, status, before_label, verify_count, challenged)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReport = db.prepare(`
    INSERT INTO reports (id, issue_id, reporter_name, category, location)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertUpdate = db.prepare(`
    INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVolunteer = db.prepare(`
    INSERT INTO volunteers (id, issue_id, name)
    VALUES (?, ?, ?)
  `);

  // FL1001
  insertIssue.run(
    'FL1001',
    'Broken streetlight',
    'Streetlight',
    'Streetlight pole opposite the central library entrance is completely dead. Entire walkway is in pitch darkness after 7 PM, creating a safety hazard for night-study students.',
    'Library Road',
    'High',
    4,
    5,
    'Reported',
    'Dark fixture & exposed junction wiring',
    0,
    0
  );
  insertReport.run('REP-101', 'FL1001', 'Kabir Mehta (Student ID: 21BCE084)', 'Streetlight', 'Library Road');
  insertUpdate.run('UPD-101', 'FL1001', 'Reported', 'Report Filed', 'Initial hazard report submitted by campus community', 'Kabir Mehta', '4 days ago');
  insertUpdate.run('UPD-102', 'FL1001', 'Reported', 'Support Added', '5 students endorsed this issue via campus alerts', 'Library Road Night Commuters', '2 days ago');
  insertVolunteer.run('VOL-101', 'FL1001', 'Tanmay (Hostel 1)');

  // FL1002
  insertIssue.run(
    'FL1002',
    'Overflowing garbage bin',
    'Garbage',
    'Main central wet-waste receptacle outside student canteen is spilling onto footpaths. Attracting stray dogs and foul smell near the food seating area.',
    'Canteen Area',
    'Medium',
    3,
    3,
    'Acknowledged',
    'Spilled refuse bin near dining table 4',
    0,
    0
  );
  insertReport.run('REP-102', 'FL1002', 'Sanya R. (Mess Committee)', 'Garbage', 'Canteen Area');
  insertUpdate.run('UPD-103', 'FL1002', 'Reported', 'Report Filed', 'Sanitation hazard reported near dining porch', 'Sanya R.', '3 days ago');
  insertUpdate.run('UPD-104', 'FL1002', 'Acknowledged', 'Acknowledged', 'Sanitation contractor notified. Scheduled for clearance route.', 'Campus Facilities Desk', '1 day ago');

  // FL1003
  insertIssue.run(
    'FL1003',
    'Leaking water tap',
    'Water Leakage',
    'High-pressure washbasin brass tap on 2nd floor corridor has broken threading. Continuous stream causing water wastage and slippery flooring.',
    'Hostel Block',
    'High',
    6,
    7,
    'In Progress',
    'Continuous pressurised pipe leak',
    0,
    0
  );
  insertReport.run('REP-103', 'FL1003', 'Rohan Verma (Hostel 2 Rep)', 'Water Leakage', 'Hostel Block');
  insertUpdate.run('UPD-105', 'FL1003', 'Reported', 'Report Filed', 'Potable water wastage report lodged', 'Rohan Verma', '6 days ago');
  insertUpdate.run('UPD-106', 'FL1003', 'Acknowledged', 'Acknowledged', 'Plumbing inventory ticket assigned #PL-940', 'Estate Office', '4 days ago');
  insertUpdate.run('UPD-107', 'FL1003', 'In Progress', 'Action Started', 'Main shutoff valve isolated; replacement valve requisitioned', 'Lead Plumber Mukesh', '1 day ago');
  insertVolunteer.run('VOL-102', 'FL1003', 'Anil K. (Plumbing Lead)');
  insertVolunteer.run('VOL-103', 'FL1003', 'Pooja V. (Green Club)');

  // FL1004
  insertIssue.run(
    'FL1004',
    'Broken bench / damaged furniture',
    'Footpath/Road',
    'Concrete-slat bench near the Academic Block lawn has collapsed on one side with exposed iron rebar. Risk of injury during break hours.',
    'Academic Block',
    'Low',
    10,
    2,
    'Reported',
    'Cracked concrete bench with jagged rebar',
    0,
    0
  );
  insertReport.run('REP-104', 'FL1004', 'Prof. J. Bannerjee', 'Footpath/Road', 'Academic Block');
  insertUpdate.run('UPD-108', 'FL1004', 'Reported', 'Report Filed', 'Furniture breakage logged in front quadrangle', 'Prof. J. Bannerjee', '10 days ago');

  // FL1005
  insertIssue.run(
    'FL1005',
    'Dirty washroom',
    'Washroom',
    'Ground floor gents washroom has clogged floor drain and non-functional exhaust fan. Unhygienic conditions reported by visiting faculty and students.',
    'Academic Block, Ground Floor',
    'Medium',
    2,
    4,
    'Reported',
    'Waterlogged floor and clogged drainage trap',
    0,
    0
  );
  insertReport.run('REP-105', 'FL1005', 'Nikhil T. (Department Rep)', 'Washroom', 'Academic Block, Ground Floor');
  insertUpdate.run('UPD-109', 'FL1005', 'Reported', 'Report Filed', 'Sanitary sanitation inspection ticket created', 'Nikhil T.', '2 days ago');

  // FL1006
  insertIssue.run(
    'FL1006',
    'Non-working classroom fan',
    'Classroom Equipment',
    'Overhead ceiling fan in Lecture Hall 203 has developed an electrical coil burn and does not spin. Poor ventilation during midday lectures.',
    'Academic Block',
    'Medium',
    5,
    3,
    'Acknowledged',
    'Burned regulator and seized ceiling fan #3',
    0,
    0
  );
  insertReport.run('REP-106', 'FL1006', 'Class Representative Divya', 'Classroom Equipment', 'Academic Block');
  insertUpdate.run('UPD-110', 'FL1006', 'Reported', 'Report Filed', 'HVAC / Fan failure logged in LH-203', 'Divya P.', '5 days ago');
  insertUpdate.run('UPD-111', 'FL1006', 'Acknowledged', 'Acknowledged', 'Electrician requested capacitor & regulator replacement', 'Campus Electrical Services', '2 days ago');
}

/**
 * Resets database and re-seeds canonical demo data
 */
function resetDatabase() {
  db.exec(`
    DELETE FROM volunteers;
    DELETE FROM verifications;
    DELETE FROM updates;
    DELETE FROM reports;
    DELETE FROM issues;
  `);
  seedDatabase();
}

/**
 * Formats database issue row for API responses
 */
function formatIssueRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    location: row.location,
    severity: row.severity,
    daysPending: Number(row.days_pending),
    supports: Number(row.supports),
    status: row.status,
    priorityScore: calculatePriorityScore(row.severity, row.supports, row.days_pending),
    beforeLabel: row.before_label,
    beforeImage: row.before_image,
    afterLabel: row.after_label,
    afterImage: row.after_image,
    verifyCount: Number(row.verify_count),
    challenged: Boolean(row.challenged),
    challengedReason: row.challenged_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Get aggregated dashboard statistics
 */
function getStats() {
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM issues').get();
  const awaitingRow = db.prepare(`SELECT COUNT(*) as count FROM issues WHERE status IN ('Reported', 'Acknowledged')`).get();
  const progressRow = db.prepare(`SELECT COUNT(*) as count FROM issues WHERE status IN ('In Progress', 'Verification Pending')`).get();
  const resolvedRow = db.prepare(`SELECT COUNT(*) as count FROM issues WHERE status = 'Verified Resolved'`).get();

  return {
    total: totalRow.count,
    awaiting: awaitingRow.count,
    progress: progressRow.count,
    resolved: resolvedRow.count
  };
}

/**
 * Get all issues with filtering, search, and sorting
 */
function getAllIssues(filters = {}) {
  let query = 'SELECT * FROM issues WHERE 1=1';
  const params = [];

  if (filters.status && filters.status !== 'ALL') {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.category && filters.category !== 'ALL') {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters.severity && filters.severity !== 'ALL') {
    query += ' AND severity = ?';
    params.push(filters.severity);
  }

  if (filters.search) {
    query += ' AND (id LIKE ? OR title LIKE ? OR description LIKE ? OR location LIKE ?)';
    const s = `%${filters.search}%`;
    params.push(s, s, s, s);
  }

  if (filters.hideClosed === true || filters.hideClosed === 'true') {
    query += ` AND status != 'Verified Resolved'`;
  }

  const rows = db.prepare(query).all(...params);
  const formatted = rows.map(formatIssueRow);

  // Sorting
  const sort = filters.sort || 'priority';
  formatted.sort((a, b) => {
    if (sort === 'priority') {
      return b.priorityScore - a.priorityScore;
    } else if (sort === 'supports') {
      return b.supports - a.supports;
    } else if (sort === 'days') {
      return b.daysPending - a.daysPending;
    } else if (sort === 'newest') {
      const numA = parseInt(a.id.replace(/\D/g, '') || 0, 10);
      const numB = parseInt(b.id.replace(/\D/g, '') || 0, 10);
      return numB - numA;
    }
    return 0;
  });

  return formatted;
}

/**
 * Get issue by ID with complete relations (updates, volunteers, verifications)
 */
function getIssueById(id) {
  const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
  if (!row) return null;

  const issue = formatIssueRow(row);

  // Updates / Timeline History
  const updates = db.prepare('SELECT * FROM updates WHERE issue_id = ? ORDER BY created_at DESC').all(id);
  issue.createdHistory = updates.map(u => ({
    id: u.id,
    status: u.status,
    badge: u.badge || u.status,
    remark: u.remark,
    actor: u.actor,
    timeLabel: u.time_label || 'Recently',
    createdAt: u.created_at
  }));

  // Volunteers
  const volunteers = db.prepare('SELECT * FROM volunteers WHERE issue_id = ? ORDER BY created_at DESC').all(id);
  issue.volunteers = volunteers.map(v => ({
    id: v.id,
    name: v.name,
    createdAt: v.created_at
  }));

  // Verifications
  const verifications = db.prepare('SELECT * FROM verifications WHERE issue_id = ? ORDER BY created_at DESC').all(id);
  issue.verifications = verifications.map(v => ({
    id: v.id,
    decision: v.decision,
    voterName: v.voter_name,
    note: v.note,
    createdAt: v.created_at
  }));

  return issue;
}

/**
 * CORE FEATURE 1: Check for duplicate open issue
 */
function findDuplicate(category, location) {
  const row = db.prepare(`
    SELECT * FROM issues 
    WHERE LOWER(TRIM(category)) = LOWER(TRIM(?)) 
      AND LOWER(TRIM(location)) = LOWER(TRIM(?))
      AND status != 'Verified Resolved'
    LIMIT 1
  `).get(category, location);

  return row ? formatIssueRow(row) : null;
}

/**
 * Merge report into existing issue
 */
function mergeDuplicate(existingIssue, reportData) {
  const oldPriority = existingIssue.priorityScore;
  const newSupports = existingIssue.supports + 1;

  db.prepare(`
    UPDATE issues 
    SET supports = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(newSupports, existingIssue.id);

  const reportId = 'REP-' + Date.now();
  db.prepare(`
    INSERT INTO reports (id, issue_id, reporter_name, category, location)
    VALUES (?, ?, ?, ?, ?)
  `).run(reportId, existingIssue.id, reportData.reporterName, reportData.category, reportData.location);

  const updateId = 'UPD-' + Date.now();
  db.prepare(`
    INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    updateId,
    existingIssue.id,
    existingIssue.status,
    'Support Merged',
    `Similar report filed by ${reportData.reporterName}. Automatically merged to boost priority.`,
    reportData.reporterName,
    'Just now'
  );

  const updatedIssue = getIssueById(existingIssue.id);
  const newPriority = updatedIssue.priorityScore;

  return {
    isDuplicate: true,
    issue: updatedIssue,
    oldPriority,
    newPriority,
    message: `Similar issue already exists in ${existingIssue.location} — your report was added as support to Issue #${existingIssue.id}.`
  };
}

/**
 * Create a new issue
 */
function createIssue(reportData) {
  // Generate next ID
  const rows = db.prepare('SELECT id FROM issues').all();
  let maxNum = 1000;
  rows.forEach(r => {
    const match = r.id && r.id.match(/^FL(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const newId = `FL${maxNum + 1}`;

  db.prepare(`
    INSERT INTO issues (id, title, category, description, location, severity, days_pending, supports, status, before_label, before_image, verify_count, challenged)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId,
    reportData.title,
    reportData.category,
    reportData.description || 'No additional details provided.',
    reportData.location,
    reportData.severity || 'Medium',
    Number(reportData.daysPending) || 0,
    1,
    'Reported',
    reportData.beforeLabel || `${reportData.title} (Original Report)`,
    reportData.beforeImage || null,
    0,
    0
  );

  const reportId = 'REP-' + Date.now();
  db.prepare(`
    INSERT INTO reports (id, issue_id, reporter_name, category, location)
    VALUES (?, ?, ?, ?, ?)
  `).run(reportId, newId, reportData.reporterName, reportData.category, reportData.location);

  const updateId = 'UPD-' + Date.now();
  db.prepare(`
    INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    updateId,
    newId,
    'Reported',
    'Report Created',
    `Defect reported on campus: "${reportData.title}"`,
    reportData.reporterName,
    'Just now'
  );

  const issue = getIssueById(newId);
  return {
    isDuplicate: false,
    issue,
    message: `New issue #${newId} logged successfully!`
  };
}

/**
 * Acknowledge Issue
 */
function acknowledgeIssue(id, actor = 'Campus Facilities Desk') {
  db.prepare(`
    UPDATE issues 
    SET status = 'Acknowledged', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND status = 'Reported'
  `).run(id);

  db.prepare(`
    INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'UPD-' + Date.now(),
    id,
    'Acknowledged',
    'Acknowledged',
    'Campus maintenance acknowledged the report. Work ticket queued.',
    actor,
    'Just now'
  );

  return getIssueById(id);
}

/**
 * Start Action (In Progress)
 */
function startAction(id, actor = 'Estate Maintenance Crew') {
  db.prepare(`
    UPDATE issues 
    SET status = 'In Progress', challenged = 0, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(id);

  db.prepare(`
    INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'UPD-' + Date.now(),
    id,
    'In Progress',
    'Action Started',
    'Ground crew dispatched. Repair materials requisitioned.',
    actor,
    'Just now'
  );

  return getIssueById(id);
}

/**
 * Mark as Fixed (Sets to Verification Pending — NEVER resolved!)
 */
function markFixed(id, { workNote, afterImage, actor = 'Field Technician' }) {
  db.prepare(`
    UPDATE issues 
    SET status = 'Verification Pending', 
        after_label = ?, 
        after_image = ?, 
        verify_count = 0, 
        challenged = 0, 
        challenged_reason = NULL,
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(workNote || 'Work completed per specifications', afterImage || null, id);

  db.prepare(`
    INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'UPD-' + Date.now(),
    id,
    'Verification Pending',
    'Fixed (Pending Verification)',
    `Maintenance reported fix: "${workNote}". After-evidence submitted. Independent verification required.`,
    actor,
    'Just now'
  );

  return getIssueById(id);
}

/**
 * Verify Issue (2 independent votes needed)
 */
function verifyIssue(id, { voterName, note = '' }) {
  const issue = getIssueById(id);
  if (!issue || issue.status !== 'Verification Pending') return null;

  const newVerifyCount = issue.verifyCount + 1;
  const isResolved = newVerifyCount >= 2;
  const newStatus = isResolved ? 'Verified Resolved' : 'Verification Pending';

  db.prepare(`
    UPDATE issues 
    SET verify_count = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(newVerifyCount, newStatus, id);

  db.prepare(`
    INSERT INTO verifications (id, issue_id, decision, voter_name, note)
    VALUES (?, ?, ?, ?, ?)
  `).run('VER-' + Date.now(), id, 'verify', voterName, note);

  if (isResolved) {
    db.prepare(`
      INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'UPD-' + Date.now(),
      id,
      'Verified Resolved',
      'Verified Resolved (2/2)',
      `Second independent verification confirmed by ${voterName}${note ? ': "' + note + '"' : ''}. Problem officially solved!`,
      `${voterName} (Peer Inspector)`,
      'Just now'
    );
  } else {
    db.prepare(`
      INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'UPD-' + Date.now(),
      id,
      'Verification Pending',
      'Verification 1/2',
      `Independent verification confirmed by ${voterName}${note ? ': "' + note + '"' : ''}. One more verification needed to close.`,
      `${voterName} (Peer Inspector)`,
      'Just now'
    );
  }

  return getIssueById(id);
}

/**
 * Challenge Fix (Reverts to In Progress)
 */
function challengeIssue(id, { challengerName, reason }) {
  db.prepare(`
    UPDATE issues 
    SET status = 'In Progress', 
        challenged = 1, 
        challenged_reason = ?, 
        verify_count = 0, 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(reason, id);

  db.prepare(`
    INSERT INTO verifications (id, issue_id, decision, voter_name, note)
    VALUES (?, ?, ?, ?, ?)
  `).run('VER-' + Date.now(), id, 'challenge', challengerName, reason);

  db.prepare(`
    INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'UPD-' + Date.now(),
    id,
    'In Progress',
    'Fix Challenged ⚠️',
    `Resolution challenged by ${challengerName}: "${reason}". Reverted back to In Progress.`,
    `${challengerName} (Challenger)`,
    'Just now'
  );

  return getIssueById(id);
}

/**
 * Add volunteer
 */
function addVolunteer(id, { name }) {
  db.prepare(`
    INSERT INTO volunteers (id, issue_id, name)
    VALUES (?, ?, ?)
  `).run('VOL-' + Date.now(), id, name);

  db.prepare(`
    INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'UPD-' + Date.now(),
    id,
    'Volunteer Joined',
    'Volunteer Joined',
    `${name} signed up as a community watcher for this issue.`,
    name,
    'Just now'
  );

  return getIssueById(id);
}

/**
 * Delete a single issue by ID
 */
function deleteIssue(id) {
  const issue = getIssueById(id);
  if (!issue) return null;

  db.prepare('DELETE FROM issues WHERE id = ?').run(id);
  return issue;
}

/**
 * Delete all verified resolved / closed issues
 */
function deleteClosedIssues() {
  const result = db.prepare(`DELETE FROM issues WHERE status = 'Verified Resolved'`).run();
  return { deletedCount: result.changes };
}

/**
 * Endorse / Upvote an issue directly (+1 Support)
 */
function supportIssue(id, supporterName = 'Campus Community Member') {
  const issue = getIssueById(id);
  if (!issue) return null;

  const newSupports = issue.supports + 1;
  db.prepare(`UPDATE issues SET supports = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newSupports, id);

  db.prepare(`
    INSERT INTO reports (id, issue_id, reporter_name, category, location)
    VALUES (?, ?, ?, ?, ?)
  `).run('REP-' + Date.now(), id, supporterName, issue.category, issue.location);

  db.prepare(`
    INSERT INTO updates (id, issue_id, status, badge, remark, actor, time_label)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'UPD-' + Date.now(),
    id,
    issue.status,
    'Endorsement Added',
    `Community member ${supporterName} endorsed this issue (+3 priority score).`,
    supporterName,
    'Just now'
  );

  return getIssueById(id);
}

// Initialize on module load
initDatabase();

module.exports = {
  initDatabase,
  resetDatabase,
  getStats,
  getAllIssues,
  getIssueById,
  findDuplicate,
  mergeDuplicate,
  createIssue,
  acknowledgeIssue,
  startAction,
  markFixed,
  verifyIssue,
  challengeIssue,
  addVolunteer,
  deleteIssue,
  deleteClosedIssues,
  supportIssue,
  calculatePriorityScore
};
