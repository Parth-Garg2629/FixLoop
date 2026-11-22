/**
 * FIXLOOP — REST Backend Server
 * Express.js server connected to SQLite database
 */

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// ==========================================================================
// REST API ENDPOINTS
// ==========================================================================

/**
 * Health check & database status
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'FIXLOOP Backend',
    database: 'SQLite (node:sqlite native)',
    timestamp: new Date().toISOString()
  });
});

/**
 * Aggregated stats (Total, Awaiting, Progress, Resolved)
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

/**
 * List all issues with filters, search, and sorting
 */
app.get('/api/issues', (req, res) => {
  try {
    const { status, category, severity, search, sort, hideClosed } = req.query;
    const issues = db.getAllIssues({ status, category, severity, search, sort, hideClosed });
    res.json(issues);
  } catch (err) {
    console.error('Error fetching issues:', err);
    res.status(500).json({ error: 'Failed to retrieve issues' });
  }
});

/**
 * Get issue by ID with timeline history, volunteers, and verifications
 */
app.get('/api/issues/:id', (req, res) => {
  try {
    const issue = db.getIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    console.error('Error fetching issue:', err);
    res.status(500).json({ error: 'Failed to retrieve issue' });
  }
});

/**
 * Report a Problem
 * Includes CORE FEATURE 1: Smart Duplicate Merge!
 */
app.post('/api/issues', (req, res) => {
  try {
    const { reporterName, category, location, title, description, severity, daysPending, beforeImage, beforeLabel } = req.body;

    if (!reporterName || !category || !location || !title) {
      return res.status(400).json({ error: 'Missing required report fields (name, category, location, title)' });
    }

    // Check for duplicate open issue
    const duplicate = db.findDuplicate(category, location);

    if (duplicate) {
      // DUPLICATE DETECTED: Merge as community support
      const result = db.mergeDuplicate(duplicate, {
        reporterName,
        category,
        location
      });
      return res.status(200).json(result);
    }

    // No duplicate: Create new issue
    const result = db.createIssue({
      reporterName,
      category,
      location,
      title,
      description,
      severity,
      daysPending,
      beforeImage,
      beforeLabel
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating/merging issue:', err);
    res.status(500).json({ error: 'Failed to process issue report' });
  }
});

/**
 * Action: Acknowledge Issue
 */
app.post('/api/issues/:id/acknowledge', (req, res) => {
  try {
    const actor = req.body.actor || 'Campus Facilities Desk';
    const issue = db.acknowledgeIssue(req.params.id, actor);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found or not in Reported state' });
    }
    res.json(issue);
  } catch (err) {
    console.error('Error acknowledging issue:', err);
    res.status(500).json({ error: 'Failed to acknowledge issue' });
  }
});

/**
 * Action: Start Action (In Progress)
 */
app.post('/api/issues/:id/start-action', (req, res) => {
  try {
    const actor = req.body.actor || 'Estate Maintenance Crew';
    const issue = db.startAction(req.params.id, actor);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    console.error('Error starting action:', err);
    res.status(500).json({ error: 'Failed to start action on issue' });
  }
});

/**
 * Action: Mark as Fixed
 * Moves issue to "Verification Pending" — NEVER directly to Resolved!
 */
app.post('/api/issues/:id/mark-fixed', (req, res) => {
  try {
    const { workNote, afterImage, actor } = req.body;
    if (!workNote) {
      return res.status(400).json({ error: 'Work summary is required to mark fixed' });
    }
    const issue = db.markFixed(req.params.id, {
      workNote,
      afterImage,
      actor: actor || 'Field Technician'
    });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    console.error('Error marking fixed:', err);
    res.status(500).json({ error: 'Failed to mark issue as fixed' });
  }
});

/**
 * Action: Verify Fix (Independent Community Vote)
 * 2 votes required to reach "Verified Resolved"
 */
app.post('/api/issues/:id/verify', (req, res) => {
  try {
    const { voterName, note } = req.body;
    if (!voterName) {
      return res.status(400).json({ error: 'Verifier name is required' });
    }
    const issue = db.verifyIssue(req.params.id, { voterName, note });
    if (!issue) {
      return res.status(400).json({ error: 'Issue not in Verification Pending state or not found' });
    }
    res.json(issue);
  } catch (err) {
    console.error('Error verifying issue:', err);
    res.status(500).json({ error: 'Failed to record verification' });
  }
});

/**
 * Action: Challenge Fix
 * Reverts issue to "In Progress" with challenge reason
 */
app.post('/api/issues/:id/challenge', (req, res) => {
  try {
    const { challengerName, reason } = req.body;
    if (!challengerName || !reason) {
      return res.status(400).json({ error: 'Challenger name and reason are required' });
    }
    const issue = db.challengeIssue(req.params.id, { challengerName, reason });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    console.error('Error challenging fix:', err);
    res.status(500).json({ error: 'Failed to record challenge' });
  }
});

/**
 * Action: Volunteer for Follow-up
 */
app.post('/api/issues/:id/volunteer', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Volunteer name is required' });
    }
    const issue = db.addVolunteer(req.params.id, { name });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    console.error('Error adding volunteer:', err);
    res.status(500).json({ error: 'Failed to add volunteer' });
  }
});

/**
 * Endorse / +1 Support an issue directly
 */
app.post('/api/issues/:id/support', (req, res) => {
  try {
    const supporterName = req.body.supporterName || 'Campus Community Member';
    const issue = db.supportIssue(req.params.id, supporterName);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    console.error('Error supporting issue:', err);
    res.status(500).json({ error: 'Failed to support issue' });
  }
});

/**
 * Delete / Clear all closed & verified resolved issues
 */
app.delete('/api/issues/resolved/all', (req, res) => {
  try {
    const result = db.deleteClosedIssues();
    res.json({ success: true, deletedCount: result.deletedCount, message: `Removed ${result.deletedCount} resolved issues from database.` });
  } catch (err) {
    console.error('Error deleting resolved issues:', err);
    res.status(500).json({ error: 'Failed to delete resolved issues' });
  }
});

/**
 * Delete a specific issue by ID
 */
app.delete('/api/issues/:id', (req, res) => {
  try {
    const deleted = db.deleteIssue(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json({ success: true, message: `Issue #${req.params.id} removed from board.`, issue: deleted });
  } catch (err) {
    console.error('Error deleting issue:', err);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

/**
 * Reset Demo Data
 */
app.post('/api/reset-demo', (req, res) => {
  try {
    db.resetDatabase();
    res.json({ success: true, message: 'Database reset to initial 6 campus issues' });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` FIXLOOP REST Backend & SQLite Database is running!`);
  console.log(` Web App:  http://localhost:${PORT}`);
  console.log(` API Base: http://localhost:${PORT}/api/issues`);
  console.log(` Database: SQLite file at ./data/fixloop.db`);
  console.log(`==================================================\n`);
});

module.exports = { app, server };
