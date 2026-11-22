/**
 * FIXLOOP — Community-Powered Public Issue Verification Engine
 * Hybrid Client: Seamlessly connects to the REST Backend & SQLite Database,
 * with graceful offline fallback to LocalStorage if run standalone.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONSTANTS & SEEDED DEMO DATA
  // ==========================================================================
  const STORAGE_KEY = 'fixloop_data';
  let backendAvailable = false;

  // Base Seed Data for College Campus Pilot
  const SEEDED_ISSUES = [
    {
      id: 'FL1001',
      title: 'Broken streetlight',
      category: 'Streetlight',
      description: 'Streetlight pole opposite the central library entrance is completely dead. Entire walkway is in pitch darkness after 7 PM, creating a safety hazard for night-study students.',
      location: 'Library Road',
      severity: 'High',
      daysPending: 4,
      supports: 5,
      status: 'Reported',
      beforeLabel: 'Dark fixture & exposed junction wiring',
      beforeImage: null,
      afterLabel: '',
      afterImage: null,
      verifyCount: 0,
      challenged: false,
      challengedReason: '',
      createdHistory: [
        {
          id: 'hist-1001-1',
          status: 'Reported',
          badge: 'Report Filed',
          remark: 'Initial hazard report submitted by campus community',
          actor: 'Kabir Mehta (Student ID: 21BCE084)',
          timeLabel: '4 days ago'
        },
        {
          id: 'hist-1001-2',
          status: 'Reported',
          badge: 'Support Added',
          remark: '5 students endorsed this issue via campus alerts',
          actor: 'Library Road Night Commuters',
          timeLabel: '2 days ago'
        }
      ]
    },
    {
      id: 'FL1002',
      title: 'Overflowing garbage bin',
      category: 'Garbage',
      description: 'Main central wet-waste receptacle outside student canteen is spilling onto footpaths. Attracting stray dogs and foul smell near the food seating area.',
      location: 'Canteen Area',
      severity: 'Medium',
      daysPending: 3,
      supports: 3,
      status: 'Acknowledged',
      beforeLabel: 'Spilled refuse bin near dining table 4',
      beforeImage: null,
      afterLabel: '',
      afterImage: null,
      verifyCount: 0,
      challenged: false,
      challengedReason: '',
      createdHistory: [
        {
          id: 'hist-1002-1',
          status: 'Reported',
          badge: 'Report Filed',
          remark: 'Sanitation hazard reported near dining porch',
          actor: 'Sanya R. (Mess Committee)',
          timeLabel: '3 days ago'
        },
        {
          id: 'hist-1002-2',
          status: 'Acknowledged',
          badge: 'Acknowledged',
          remark: 'Sanitation contractor notified. Scheduled for clearance route.',
          actor: 'Campus Facilities Desk (Mr. Sharma)',
          timeLabel: '1 day ago'
        }
      ]
    },
    {
      id: 'FL1003',
      title: 'Leaking water tap',
      category: 'Water Leakage',
      description: 'High-pressure washbasin brass tap on 2nd floor corridor has broken threading. Continuous stream causing water wastage and slippery flooring.',
      location: 'Hostel Block',
      severity: 'High',
      daysPending: 6,
      supports: 7,
      status: 'In Progress',
      beforeLabel: 'Continuous pressurised pipe leak',
      beforeImage: null,
      afterLabel: '',
      afterImage: null,
      verifyCount: 0,
      challenged: false,
      challengedReason: '',
      createdHistory: [
        {
          id: 'hist-1003-1',
          status: 'Reported',
          badge: 'Report Filed',
          remark: 'Potable water wastage report lodged',
          actor: 'Rohan Verma (Hostel 2 Warden Rep)',
          timeLabel: '6 days ago'
        },
        {
          id: 'hist-1003-2',
          status: 'Acknowledged',
          badge: 'Acknowledged',
          remark: 'Plumbing inventory ticket assigned #PL-940',
          actor: 'Estate Office',
          timeLabel: '4 days ago'
        },
        {
          id: 'hist-1003-3',
          status: 'In Progress',
          badge: 'Action Started',
          remark: 'Main shutoff valve isolated; replacement valve requisitioned',
          actor: 'Lead Plumber Mukesh',
          timeLabel: '1 day ago'
        }
      ]
    },
    {
      id: 'FL1004',
      title: 'Broken bench / damaged furniture',
      category: 'Footpath/Road',
      description: 'Concrete-slat bench near the Academic Block lawn has collapsed on one side with exposed iron rebar. Risk of injury during break hours.',
      location: 'Academic Block',
      severity: 'Low',
      daysPending: 10,
      supports: 2,
      status: 'Reported',
      beforeLabel: 'Cracked concrete bench with jagged rebar',
      beforeImage: null,
      afterLabel: '',
      afterImage: null,
      verifyCount: 0,
      challenged: false,
      challengedReason: '',
      createdHistory: [
        {
          id: 'hist-1004-1',
          status: 'Reported',
          badge: 'Report Filed',
          remark: 'Furniture breakage logged in front quadrangle',
          actor: 'Prof. J. Bannerjee',
          timeLabel: '10 days ago'
        }
      ]
    },
    {
      id: 'FL1005',
      title: 'Dirty washroom',
      category: 'Washroom',
      description: 'Ground floor gents washroom has clogged floor drain and non-functional exhaust fan. Unhygienic conditions reported by visiting faculty and students.',
      location: 'Academic Block, Ground Floor',
      severity: 'Medium',
      daysPending: 2,
      supports: 4,
      status: 'Reported',
      beforeLabel: 'Waterlogged floor and clogged drainage trap',
      beforeImage: null,
      afterLabel: '',
      afterImage: null,
      verifyCount: 0,
      challenged: false,
      challengedReason: '',
      createdHistory: [
        {
          id: 'hist-1005-1',
          status: 'Reported',
          badge: 'Report Filed',
          remark: 'Sanitary sanitation inspection ticket created',
          actor: 'Nikhil T. (Department Rep)',
          timeLabel: '2 days ago'
        }
      ]
    },
    {
      id: 'FL1006',
      title: 'Non-working classroom fan',
      category: 'Classroom Equipment',
      description: 'Overhead ceiling fan in Lecture Hall 203 has developed an electrical coil burn and does not spin. Poor ventilation during midday lectures.',
      location: 'Academic Block',
      severity: 'Medium',
      daysPending: 5,
      supports: 3,
      status: 'Acknowledged',
      beforeLabel: 'Burned regulator and seized ceiling fan #3',
      beforeImage: null,
      afterLabel: '',
      afterImage: null,
      verifyCount: 0,
      challenged: false,
      challengedReason: '',
      createdHistory: [
        {
          id: 'hist-1006-1',
          status: 'Reported',
          badge: 'Report Filed',
          remark: 'HVAC / Fan failure logged in LH-203',
          actor: 'Class Representative Divya',
          timeLabel: '5 days ago'
        },
        {
          id: 'hist-1006-2',
          status: 'Acknowledged',
          badge: 'Acknowledged',
          remark: 'Electrician requested capacitor & regulator replacement',
          actor: 'Campus Electrical Services',
          timeLabel: '2 days ago'
        }
      ]
    }
  ];

  const SEEDED_REPORTS = [
    { id: 'REP-101', issueId: 'FL1001', reporterName: 'Kabir Mehta', category: 'Streetlight', location: 'Library Road', timestamp: '4 days ago' },
    { id: 'REP-102', issueId: 'FL1002', reporterName: 'Sanya R.', category: 'Garbage', location: 'Canteen Area', timestamp: '3 days ago' },
    { id: 'REP-103', issueId: 'FL1003', reporterName: 'Rohan Verma', category: 'Water Leakage', location: 'Hostel Block', timestamp: '6 days ago' },
    { id: 'REP-104', issueId: 'FL1004', reporterName: 'Prof. J. Bannerjee', category: 'Footpath/Road', location: 'Academic Block', timestamp: '10 days ago' },
    { id: 'REP-105', issueId: 'FL1005', reporterName: 'Nikhil T.', category: 'Washroom', location: 'Academic Block, Ground Floor', timestamp: '2 days ago' },
    { id: 'REP-106', issueId: 'FL1006', reporterName: 'Divya P.', category: 'Classroom Equipment', location: 'Academic Block', timestamp: '5 days ago' }
  ];

  const SEEDED_UPDATES = [
    { id: 'UPD-101', issueId: 'FL1001', status: 'Reported', remark: 'Initial issue reported', timeLabel: '4 days ago' },
    { id: 'UPD-102', issueId: 'FL1002', status: 'Acknowledged', remark: 'Sanitation contractor dispatched', timeLabel: '1 day ago' },
    { id: 'UPD-103', issueId: 'FL1003', status: 'In Progress', remark: 'Plumber isolating main line', timeLabel: '1 day ago' }
  ];

  const SEEDED_VERIFICATIONS = [];

  const SEEDED_VOLUNTEERS = [
    { id: 'VOL-101', issueId: 'FL1001', name: 'Tanmay (Hostel 1)', timestamp: '3 days ago' },
    { id: 'VOL-102', issueId: 'FL1003', name: 'Anil K. (Plumbing Lead)', timestamp: '2 days ago' },
    { id: 'VOL-103', issueId: 'FL1003', name: 'Pooja V. (Green Club)', timestamp: '1 day ago' }
  ];

  // ==========================================================================
  // 2. DATA LAYER (Hybrid: Backend API + LocalStorage Fallback)
  // ==========================================================================
  let appState = {
    issues: [],
    reports: [],
    updates: [],
    verifications: [],
    volunteers: []
  };

  let currentFilters = {
    status: 'ALL',
    category: 'ALL',
    severity: 'ALL',
    search: '',
    sort: 'priority'
  };

  let activeModalIssueId = null;
  let stagedBeforePhoto = null;
  let stagedAfterPhoto = null;

  async function checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'online') {
          backendAvailable = true;
          updateBackendIndicator(true, 'SQLite DB (Online)');
          return true;
        }
      }
    } catch {
      // Backend not running; running offline
    }
    backendAvailable = false;
    updateBackendIndicator(false, 'Local Mode (Offline)');
    return false;
  }

  function updateBackendIndicator(online, text) {
    const badge = document.getElementById('db-connection-badge');
    const label = document.getElementById('db-connection-text');
    if (!badge || !label) return;

    if (online) {
      badge.className = 'db-badge connected';
      label.textContent = text;
      badge.title = 'Connected to Node.js REST API with SQLite database';
    } else {
      badge.className = 'db-badge offline';
      label.textContent = text;
      badge.title = 'Running standalone using browser LocalStorage';
    }
  }

  async function loadData() {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        await refreshDataFromBackend();
        return;
      } catch (err) {
        console.warn('Backend fetch error, falling back to local:', err);
      }
    }

    // Fallback: LocalStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.issues) && parsed.issues.length > 0) {
          appState = parsed;
          return;
        }
      }
    } catch (err) {
      console.warn('Could not read localStorage:', err);
    }
    resetDemoData(false);
  }

  async function refreshDataFromBackend() {
    const params = new URLSearchParams();
    if (currentFilters.status !== 'ALL') params.set('status', currentFilters.status);
    if (currentFilters.category !== 'ALL') params.set('category', currentFilters.category);
    if (currentFilters.severity !== 'ALL') params.set('severity', currentFilters.severity);
    if (currentFilters.search) params.set('search', currentFilters.search);
    if (currentFilters.sort) params.set('sort', currentFilters.sort);

    const [issuesRes, statsRes] = await Promise.all([
      fetch(`/api/issues?${params.toString()}`),
      fetch('/api/stats')
    ]);

    if (issuesRes.ok && statsRes.ok) {
      appState.issues = await issuesRes.json();
      const stats = await statsRes.json();
      applyStats(stats);
      renderIssuesListOnly(appState.issues);
    }
  }

  function saveData() {
    if (!backendAvailable) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  }

  async function resetDemoData(confirmNeeded = true) {
    if (confirmNeeded && !confirm('Are you sure you want to reset all campus demo data? This will restore the 6 initial issues in the database.')) {
      return;
    }

    if (backendAvailable) {
      try {
        const res = await fetch('/api/reset-demo', { method: 'POST' });
        if (res.ok) {
          await refreshDataFromBackend();
          showToast('Database reset to initial 6 campus issues.', 'success');
          return;
        }
      } catch (err) {
        console.warn('Reset via backend failed, using local reset:', err);
      }
    }

    appState = {
      issues: JSON.parse(JSON.stringify(SEEDED_ISSUES)),
      reports: JSON.parse(JSON.stringify(SEEDED_REPORTS)),
      updates: JSON.parse(JSON.stringify(SEEDED_UPDATES)),
      verifications: JSON.parse(JSON.stringify(SEEDED_VERIFICATIONS)),
      volunteers: JSON.parse(JSON.stringify(SEEDED_VOLUNTEERS))
    };
    saveData();
    renderAll();
    showToast('Demo data restored to initial 6 campus issues.', 'success');
  }

  // ==========================================================================
  // 3. CORE LOGIC: PRIORITY SCORE & DUPLICATE DETECTION
  // ==========================================================================

  function calculatePriority(issue) {
    let sevPoints = 20;
    if (issue.severity === 'High') sevPoints = 30;
    else if (issue.severity === 'Low') sevPoints = 10;

    const supportPoints = (Number(issue.supports) || 0) * 3;
    const daysPoints = (Number(issue.daysPending) || 0) * 2;

    return sevPoints + supportPoints + daysPoints;
  }

  function normalizeText(text) {
    return (text || '').trim().toLowerCase();
  }

  function findDuplicateLocal(category, location) {
    const targetCat = normalizeText(category);
    const targetLoc = normalizeText(location);

    return appState.issues.find(issue => {
      if (issue.status === 'Verified Resolved') return false;
      return normalizeText(issue.category) === targetCat && normalizeText(issue.location) === targetLoc;
    });
  }

  function generateNextIssueId() {
    let maxNum = 1000;
    appState.issues.forEach(issue => {
      const match = issue.id && issue.id.match(/^FL(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `FL${maxNum + 1}`;
  }

  // ==========================================================================
  // 4. ISSUE LIFECYCLE STATE TRANSITIONS
  // ==========================================================================

  async function addReportAndCheckDuplicate(reportData) {
    if (backendAvailable) {
      try {
        const res = await fetch('/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData)
        });
        if (res.ok) {
          const result = await res.json();
          await refreshDataFromBackend();

          if (result.isDuplicate) {
            showDuplicateAlert(result.issue, result.oldPriority, result.newPriority);
          } else {
            showToast(`New issue #${result.issue.id} logged in SQLite database!`, 'success');
            openIssueDetail(result.issue.id);
          }
          return;
        }
      } catch (err) {
        console.warn('Backend submission failed, falling back to local:', err);
      }
    }

    // Fallback: Local duplicate logic
    const duplicate = findDuplicateLocal(reportData.category, reportData.location);

    if (duplicate) {
      const oldPriority = calculatePriority(duplicate);
      duplicate.supports = (Number(duplicate.supports) || 0) + 1;
      const newPriority = calculatePriority(duplicate);

      appState.reports.push({
        id: 'REP-' + Date.now(),
        issueId: duplicate.id,
        reporterName: reportData.reporterName,
        category: reportData.category,
        location: reportData.location,
        timestamp: 'Just now'
      });

      duplicate.createdHistory = duplicate.createdHistory || [];
      duplicate.createdHistory.unshift({
        id: 'hist-' + Date.now(),
        status: duplicate.status,
        badge: 'Support Merged',
        remark: `Similar report filed by ${reportData.reporterName}. Automatically merged to boost priority.`,
        actor: reportData.reporterName,
        timeLabel: 'Just now'
      });

      saveData();
      renderAll();
      showDuplicateAlert(duplicate, oldPriority, newPriority);
      return;
    }

    const newId = generateNextIssueId();
    const newIssue = {
      id: newId,
      title: reportData.title,
      category: reportData.category,
      description: reportData.description || 'No additional details provided.',
      location: reportData.location,
      severity: reportData.severity,
      daysPending: Number(reportData.daysPending) || 0,
      supports: 1,
      status: 'Reported',
      beforeLabel: reportData.beforeLabel || `${reportData.title} (Original Report)`,
      beforeImage: reportData.beforeImage || null,
      afterLabel: '',
      afterImage: null,
      verifyCount: 0,
      challenged: false,
      challengedReason: '',
      createdHistory: [
        {
          id: 'hist-' + Date.now(),
          status: 'Reported',
          badge: 'Report Created',
          remark: `Defect reported on campus: "${reportData.title}"`,
          actor: reportData.reporterName,
          timeLabel: 'Just now'
        }
      ]
    };

    appState.issues.unshift(newIssue);
    saveData();
    renderAll();
    showToast(`New issue #${newId} logged successfully!`, 'success');
    openIssueDetail(newId);
  }

  async function acknowledgeIssue(issueId, actor = 'Campus Facilities Desk') {
    if (backendAvailable) {
      try {
        const res = await fetch(`/api/issues/${issueId}/acknowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor })
        });
        if (res.ok) {
          await refreshDataFromBackend();
          renderIssueDetail(issueId);
          showToast(`Issue #${issueId} marked as Acknowledged.`, 'info');
          return;
        }
      } catch (err) {
        console.warn('Backend call failed:', err);
      }
    }

    const issue = appState.issues.find(i => i.id === issueId);
    if (!issue || issue.status !== 'Reported') return;
    issue.status = 'Acknowledged';
    issue.createdHistory = issue.createdHistory || [];
    issue.createdHistory.unshift({
      id: 'hist-' + Date.now(),
      status: 'Acknowledged',
      badge: 'Acknowledged',
      remark: 'Campus maintenance acknowledged the report. Work ticket queued.',
      actor,
      timeLabel: 'Just now'
    });
    saveData();
    renderAll();
    renderIssueDetail(issueId);
    showToast(`Issue #${issue.id} marked as Acknowledged.`, 'info');
  }

  async function startActionIssue(issueId, actor = 'Estate Maintenance Crew') {
    if (backendAvailable) {
      try {
        const res = await fetch(`/api/issues/${issueId}/start-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor })
        });
        if (res.ok) {
          await refreshDataFromBackend();
          renderIssueDetail(issueId);
          showToast(`Issue #${issueId} is now In Progress.`, 'info');
          return;
        }
      } catch (err) {
        console.warn('Backend call failed:', err);
      }
    }

    const issue = appState.issues.find(i => i.id === issueId);
    if (!issue) return;
    issue.status = 'In Progress';
    issue.challenged = false;
    issue.createdHistory = issue.createdHistory || [];
    issue.createdHistory.unshift({
      id: 'hist-' + Date.now(),
      status: 'In Progress',
      badge: 'Action Started',
      remark: 'Ground crew dispatched. Repair materials requisitioned.',
      actor,
      timeLabel: 'Just now'
    });
    saveData();
    renderAll();
    renderIssueDetail(issueId);
    showToast(`Issue #${issue.id} is now In Progress.`, 'info');
  }

  async function markAsFixed(issueId, fixNote, afterImage = null, actor = 'Field Technician') {
    if (backendAvailable) {
      try {
        const res = await fetch(`/api/issues/${issueId}/mark-fixed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workNote: fixNote, afterImage, actor })
        });
        if (res.ok) {
          await refreshDataFromBackend();
          renderIssueDetail(issueId);
          showToast(`Evidence uploaded for #${issueId}. Status changed to Verification Pending!`, 'warning');
          return;
        }
      } catch (err) {
        console.warn('Backend call failed:', err);
      }
    }

    const issue = appState.issues.find(i => i.id === issueId);
    if (!issue) return;
    issue.status = 'Verification Pending';
    issue.afterLabel = fixNote || 'Work completed per specifications';
    issue.afterImage = afterImage;
    issue.verifyCount = 0;
    issue.challenged = false;
    issue.createdHistory = issue.createdHistory || [];
    issue.createdHistory.unshift({
      id: 'hist-' + Date.now(),
      status: 'Verification Pending',
      badge: 'Fixed (Pending Verification)',
      remark: `Maintenance reported fix: "${fixNote}". After-evidence submitted. Independent verification required.`,
      actor,
      timeLabel: 'Just now'
    });
    saveData();
    renderAll();
    renderIssueDetail(issueId);
    showToast(`Evidence uploaded for #${issue.id}. Status changed to Verification Pending!`, 'warning');
  }

  async function verifyIssue(issueId, verifierName, note = '') {
    if (backendAvailable) {
      try {
        const res = await fetch(`/api/issues/${issueId}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voterName: verifierName, note })
        });
        if (res.ok) {
          const updated = await res.json();
          await refreshDataFromBackend();
          renderIssueDetail(issueId);
          if (updated.status === 'Verified Resolved') {
            showToast(`🎉 Issue #${issueId} is officially Verified Resolved in database!`, 'success');
          } else {
            showToast(`Verification 1 of 2 recorded for #${issueId}.`, 'info');
          }
          return;
        }
      } catch (err) {
        console.warn('Backend call failed:', err);
      }
    }

    const issue = appState.issues.find(i => i.id === issueId);
    if (!issue || issue.status !== 'Verification Pending') return;

    issue.verifyCount = (Number(issue.verifyCount) || 0) + 1;
    const isNowFullyResolved = issue.verifyCount >= 2;
    issue.createdHistory = issue.createdHistory || [];

    if (isNowFullyResolved) {
      issue.status = 'Verified Resolved';
      issue.createdHistory.unshift({
        id: 'hist-' + Date.now(),
        status: 'Verified Resolved',
        badge: 'Verified Resolved (2/2)',
        remark: `Second independent verification confirmed by ${verifierName}${note ? ': "' + note + '"' : ''}. Problem officially solved!`,
        actor: `${verifierName} (Peer Inspector)`,
        timeLabel: 'Just now'
      });
      showToast(`🎉 Issue #${issue.id} is officially Verified Resolved!`, 'success');
    } else {
      issue.createdHistory.unshift({
        id: 'hist-' + Date.now(),
        status: 'Verification Pending',
        badge: 'Verification 1/2',
        remark: `Independent verification confirmed by ${verifierName}${note ? ': "' + note + '"' : ''}. One more verification needed to close.`,
        actor: `${verifierName} (Peer Inspector)`,
        timeLabel: 'Just now'
      });
      showToast(`Verification 1 of 2 recorded for #${issue.id}. One more needed.`, 'info');
    }

    saveData();
    renderAll();
    renderIssueDetail(issueId);
  }

  async function challengeIssue(issueId, reason, challengerName) {
    if (backendAvailable) {
      try {
        const res = await fetch(`/api/issues/${issueId}/challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengerName, reason })
        });
        if (res.ok) {
          await refreshDataFromBackend();
          renderIssueDetail(issueId);
          showToast(`Fix challenged on #${issueId}. Returned to In Progress.`, 'warning');
          return;
        }
      } catch (err) {
        console.warn('Backend call failed:', err);
      }
    }

    const issue = appState.issues.find(i => i.id === issueId);
    if (!issue || issue.status !== 'Verification Pending') return;

    issue.status = 'In Progress';
    issue.challenged = true;
    issue.challengedReason = reason;
    issue.verifyCount = 0;
    issue.createdHistory = issue.createdHistory || [];
    issue.createdHistory.unshift({
      id: 'hist-' + Date.now(),
      status: 'In Progress',
      badge: 'Fix Challenged ⚠️',
      remark: `Resolution challenged by ${challengerName}: "${reason}". Reverted back to In Progress.`,
      actor: `${challengerName} (Challenger)`,
      timeLabel: 'Just now'
    });

    saveData();
    renderAll();
    renderIssueDetail(issueId);
    showToast(`Fix challenged on #${issue.id}. Returned to In Progress.`, 'warning');
  }

  async function addVolunteer(issueId, volunteerName) {
    if (backendAvailable) {
      try {
        const res = await fetch(`/api/issues/${issueId}/volunteer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: volunteerName })
        });
        if (res.ok) {
          await refreshDataFromBackend();
          renderIssueDetail(issueId);
          showToast(`Thank you, ${volunteerName}! Added to Community Watchers.`, 'success');
          return;
        }
      } catch (err) {
        console.warn('Backend call failed:', err);
      }
    }

    const issue = appState.issues.find(i => i.id === issueId);
    if (!issue) return;

    appState.volunteers.push({
      id: 'VOL-' + Date.now(),
      issueId: issue.id,
      name: volunteerName,
      timestamp: 'Just now'
    });

    issue.createdHistory = issue.createdHistory || [];
    issue.createdHistory.unshift({
      id: 'hist-' + Date.now(),
      status: issue.status,
      badge: 'Volunteer Joined',
      remark: `${volunteerName} signed up as a community watcher for this issue.`,
      actor: volunteerName,
      timeLabel: 'Just now'
    });

    saveData();
    renderAll();
    renderIssueDetail(issueId);
    showToast(`Thank you, ${volunteerName}! Added to Community Watchers.`, 'success');
  }

  // ==========================================================================
  // 5. RENDERING & UI GENERATION
  // ==========================================================================

  function renderAll() {
    renderStats();
    renderIssuesList();
  }

  function applyStats(stats) {
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-awaiting').textContent = stats.awaiting;
    document.getElementById('stat-progress').textContent = stats.progress;
    document.getElementById('stat-resolved').textContent = stats.resolved;
  }

  function renderStats() {
    const total = appState.issues.length;
    let awaiting = 0;
    let progress = 0;
    let resolved = 0;

    appState.issues.forEach(issue => {
      if (issue.status === 'Reported' || issue.status === 'Acknowledged') {
        awaiting++;
      } else if (issue.status === 'In Progress' || issue.status === 'Verification Pending') {
        progress++;
      } else if (issue.status === 'Verified Resolved') {
        resolved++;
      }
    });

    applyStats({ total, awaiting, progress, resolved });
  }

  function renderIssuesList() {
    if (backendAvailable) {
      refreshDataFromBackend();
      return;
    }

    let filtered = appState.issues.filter(issue => {
      if (currentFilters.status !== 'ALL' && issue.status !== currentFilters.status) return false;
      if (currentFilters.category !== 'ALL' && issue.category !== currentFilters.category) return false;
      if (currentFilters.severity !== 'ALL' && issue.severity !== currentFilters.severity) return false;
      if (currentFilters.search) {
        const q = currentFilters.search.toLowerCase();
        const inId = issue.id.toLowerCase().includes(q);
        const inTitle = issue.title.toLowerCase().includes(q);
        const inDesc = (issue.description || '').toLowerCase().includes(q);
        const inLoc = (issue.location || '').toLowerCase().includes(q);
        if (!inId && !inTitle && !inDesc && !inLoc) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (currentFilters.sort === 'priority') {
        return calculatePriority(b) - calculatePriority(a);
      } else if (currentFilters.sort === 'supports') {
        return (Number(b.supports) || 0) - (Number(a.supports) || 0);
      } else if (currentFilters.sort === 'days') {
        return (Number(b.daysPending) || 0) - (Number(a.daysPending) || 0);
      } else if (currentFilters.sort === 'newest') {
        const numA = parseInt(a.id.replace(/\D/g, '') || 0, 10);
        const numB = parseInt(b.id.replace(/\D/g, '') || 0, 10);
        return numB - numA;
      }
      return 0;
    });

    renderIssuesListOnly(filtered);
  }

  function renderIssuesListOnly(issues) {
    const grid = document.getElementById('issues-grid');
    const emptyState = document.getElementById('empty-state');
    const countLabel = document.getElementById('issues-count-label');

    countLabel.textContent = `Showing ${issues.length} issue${issues.length === 1 ? '' : 's'}`;

    if (issues.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = issues.map(issue => createIssueCardHTML(issue)).join('');

    grid.querySelectorAll('.issue-card').forEach(card => {
      card.addEventListener('click', () => {
        openIssueDetail(card.dataset.id);
      });
    });
  }

  function createIssueCardHTML(issue) {
    const priority = issue.priorityScore !== undefined ? issue.priorityScore : calculatePriority(issue);
    const statusClass = getStatusClass(issue.status);
    const sevClass = getSeverityClass(issue.severity);
    const mediaHTML = getMediaThumbnailHTML(issue);

    return `
      <article class="issue-card" data-id="${escapeHTML(issue.id)}" tabindex="0" role="button" aria-label="View details for issue ${escapeHTML(issue.id)}: ${escapeHTML(issue.title)}">
        <div class="card-media">
          ${mediaHTML}
          <span class="card-floating-badge">${escapeHTML(issue.id)}</span>
          <span class="card-priority-pill" title="Priority Score = Severity + Supports×3 + Days×2">
            ⚡ <strong>${priority}</strong>
          </span>
        </div>
        
        <div class="card-body">
          <div class="card-meta-top">
            <span class="card-location">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${escapeHTML(issue.location)}
            </span>
            <span class="sev-badge ${sevClass}">${escapeHTML(issue.severity)} Severity</span>
          </div>

          <h3 class="card-issue-title">${escapeHTML(issue.title)}</h3>
          <p class="card-desc-snippet">${escapeHTML(issue.description)}</p>

          <div class="card-metrics-row">
            <div class="metric-cell">
              <span class="metric-cell-label">Supports</span>
              <span class="metric-cell-val">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                ${escapeHTML(issue.supports)}
              </span>
            </div>
            <div class="metric-cell">
              <span class="metric-cell-label">Neglected</span>
              <span class="metric-cell-val">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${escapeHTML(issue.daysPending)}d
              </span>
            </div>
            <div class="metric-cell">
              <span class="metric-cell-label">Category</span>
              <span class="metric-cell-val">${escapeHTML(issue.category)}</span>
            </div>
          </div>

          <div class="card-footer">
            <span class="status-badge ${statusClass}">${escapeHTML(issue.status)}</span>
            <span class="card-view-link">
              Track &amp; Verify
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
          </div>
        </div>
      </article>
    `;
  }

  function getMediaThumbnailHTML(issue) {
    if (issue.beforeImage) {
      return `<img src="${escapeHTML(issue.beforeImage)}" alt="${escapeHTML(issue.title)} evidence">`;
    }

    const theme = getCategoryTheme(issue.category);
    const icon = getCategoryIconSVG(issue.category);

    return `
      <div class="category-placeholder ${theme}">
        <div class="placeholder-icon">${icon}</div>
        <div class="placeholder-label">${escapeHTML(issue.category)}</div>
      </div>
    `;
  }

  function getCategoryTheme(category) {
    switch (category) {
      case 'Streetlight': return 'theme-streetlight';
      case 'Garbage': return 'theme-garbage';
      case 'Water Leakage': return 'theme-water';
      case 'Footpath/Road': return 'theme-road';
      case 'Washroom': return 'theme-washroom';
      case 'Classroom Equipment': return 'theme-classroom';
      default: return 'theme-other';
    }
  }

  function getCategoryIconSVG(category) {
    switch (category) {
      case 'Streetlight':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21h6M12 3a6 6 0 0 0-6 6c0 2.5 1.5 4.5 3 6h6c1.5-1.5 3-3.5 3-6a6 6 0 0 0-6-6zM10 18h4"/></svg>`;
      case 'Garbage':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
      case 'Water Leakage':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
      case 'Footpath/Road':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
      case 'Washroom':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;
      case 'Classroom Equipment':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
      default:
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case 'Reported': return 'status-reported';
      case 'Acknowledged': return 'status-acknowledged';
      case 'In Progress': return 'status-in-progress';
      case 'Verification Pending': return 'status-verification-pending';
      case 'Verified Resolved': return 'status-verified-resolved';
      default: return 'status-reported';
    }
  }

  function getSeverityClass(severity) {
    switch (severity) {
      case 'High': return 'sev-high';
      case 'Medium': return 'sev-medium';
      case 'Low': return 'sev-low';
      default: return 'sev-medium';
    }
  }

  // ==========================================================================
  // 6. ISSUE DETAIL MODAL & VERIFICATION CENTREPIECE
  // ==========================================================================

  async function openIssueDetail(issueId) {
    activeModalIssueId = issueId;
    document.getElementById('mark-fixed-drawer').classList.add('hidden');
    document.getElementById('challenge-drawer').classList.add('hidden');

    if (backendAvailable) {
      try {
        const res = await fetch(`/api/issues/${issueId}`);
        if (res.ok) {
          const issue = await res.json();
          renderIssueDetailFromObject(issue);
          document.getElementById('detail-modal').classList.remove('hidden');
          document.body.style.overflow = 'hidden';
          return;
        }
      } catch (err) {
        console.warn('Backend fetch for issue failed, using local:', err);
      }
    }

    renderIssueDetail(issueId);
    document.getElementById('detail-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeIssueDetail() {
    activeModalIssueId = null;
    document.getElementById('detail-modal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function renderIssueDetail(issueId) {
    const issue = appState.issues.find(i => i.id === issueId);
    if (!issue) return;
    renderIssueDetailFromObject(issue);
  }

  function renderIssueDetailFromObject(issue) {
    const priority = issue.priorityScore !== undefined ? issue.priorityScore : calculatePriority(issue);

    document.getElementById('modal-issue-id').textContent = issue.id;
    const statusBadge = document.getElementById('modal-status-badge');
    statusBadge.textContent = issue.status;
    statusBadge.className = 'status-badge ' + getStatusClass(issue.status);

    document.getElementById('modal-priority-value').textContent = priority;
    document.getElementById('modal-title').textContent = issue.title;
    document.getElementById('modal-location').textContent = issue.location;
    document.getElementById('modal-category').textContent = issue.category;

    const sevBadge = document.getElementById('modal-severity-badge');
    sevBadge.className = 'meta-tag ' + getSeverityClass(issue.severity);
    document.getElementById('modal-severity').textContent = `${issue.severity} Severity`;

    document.getElementById('modal-days').textContent = `${issue.daysPending} days pending`;
    document.getElementById('modal-supports').textContent = `${issue.supports} community supports`;
    document.getElementById('modal-description').textContent = issue.description;

    const challengedBanner = document.getElementById('modal-challenged-banner');
    if (issue.challenged) {
      challengedBanner.classList.remove('hidden');
      document.getElementById('modal-challenged-text').textContent =
        `Resolution was challenged: "${issue.challengedReason || 'Unresolved defect detected'}". Ticket was reverted to In Progress.`;
    } else {
      challengedBanner.classList.add('hidden');
    }

    renderEvidenceBoxes(issue);
    renderVerificationCenterpiece(issue);
    renderVolunteers(issue);
    renderTimeline(issue);
  }

  function renderEvidenceBoxes(issue) {
    const beforeWrap = document.getElementById('modal-before-media');
    const beforeCaption = document.getElementById('modal-before-caption');
    beforeCaption.textContent = issue.beforeLabel || 'Defect visual logged on creation';

    if (issue.beforeImage) {
      beforeWrap.innerHTML = `<img src="${escapeHTML(issue.beforeImage)}" alt="Before fix evidence">`;
    } else {
      const theme = getCategoryTheme(issue.category);
      const icon = getCategoryIconSVG(issue.category);
      beforeWrap.innerHTML = `
        <div class="category-placeholder ${theme}">
          <div class="placeholder-icon">${icon}</div>
          <div class="placeholder-label">${escapeHTML(issue.category)} Defect</div>
          <small class="text-sm">Verified Ground Defect</small>
        </div>
      `;
    }

    const afterWrap = document.getElementById('modal-after-media');
    const afterCaption = document.getElementById('modal-after-caption');
    const afterDate = document.getElementById('modal-after-date');

    if (issue.status === 'Verified Resolved' || issue.status === 'Verification Pending') {
      afterDate.textContent = 'Evidence Submitted';
      afterCaption.textContent = issue.afterLabel || 'Maintenance repair documentation provided';

      if (issue.afterImage) {
        afterWrap.innerHTML = `<img src="${escapeHTML(issue.afterImage)}" alt="After fix evidence">`;
      } else {
        afterWrap.innerHTML = `
          <div class="category-placeholder theme-classroom">
            <div class="placeholder-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="placeholder-label" style="color: #14532d;">Maintenance Resolution Voucher</div>
            <small class="text-sm" style="color: #166534;">Physical repair completed</small>
          </div>
        `;
      }
    } else {
      afterDate.textContent = 'Pending Repair';
      afterCaption.textContent = 'Awaiting maintenance action and photo evidence';
      afterWrap.innerHTML = `
        <div class="evidence-waiting">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>After-fix evidence will be posted by maintenance</span>
        </div>
      `;
    }
  }

  function renderVerificationCenterpiece(issue) {
    const container = document.getElementById('verification-centerpiece');
    container.innerHTML = '';

    if (issue.status === 'Verified Resolved') {
      container.innerHTML = `
        <div class="verified-seal-card">
          <div class="seal-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="seal-title">Verified Resolved &amp; Closed</div>
          <p class="seal-desc">
            This issue has completed the full FixLoop verification cycle. Maintenance repair evidence was reviewed and confirmed by <strong>2 independent community members</strong>.
          </p>
          <div class="vp-pips mt-1">
            <div class="vp-pip completed" title="Verification 1 Confirmed">✓</div>
            <div class="vp-pip completed" title="Verification 2 Confirmed">✓</div>
          </div>
        </div>
      `;
      return;
    }

    if (issue.status === 'Verification Pending') {
      const votes = Number(issue.verifyCount) || 0;
      const pip1Class = votes >= 1 ? 'completed' : '';
      const pip2Class = votes >= 2 ? 'completed' : '';

      container.innerHTML = `
        <div class="vp-header">
          <div class="logo-mark" style="width: 32px; height: 32px; background-color: var(--status-pending-text);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div class="vp-title">Community Verification Required</div>
            <div class="text-sm text-muted">A complaint cannot be closed by maintenance alone. 2 independent verifications needed.</div>
          </div>
        </div>

        <div class="vp-banner">
          <strong>Physical Check Required:</strong> Have you inspected <em>${escapeHTML(issue.location)}</em>? Confirm whether the defect has been fully repaired.
        </div>

        <div class="vp-counter-bar">
          <div class="vp-counter-label">Independent Community Verifications:</div>
          <div class="vp-counter-indicator">
            <span style="font-family: var(--font-mono); font-weight: 800; font-size: 1.1rem; color: var(--teal-700);">
              ${votes} of 2 Confirmed
            </span>
            <div class="vp-pips">
              <div class="vp-pip ${pip1Class}" title="Verification 1">${votes >= 1 ? '✓' : '1'}</div>
              <div class="vp-pip ${pip2Class}" title="Verification 2">${votes >= 2 ? '✓' : '2'}</div>
            </div>
          </div>
        </div>

        <div class="vp-action-row">
          <button type="button" class="btn btn-primary" id="btn-open-verify-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Verify Fix (${votes}/2)
          </button>
          
          <button type="button" class="btn btn-danger" id="btn-open-challenge-drawer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Challenge Fix
          </button>
        </div>
      `;

      document.getElementById('btn-open-verify-modal').addEventListener('click', openVerifyPromptModal);
      document.getElementById('btn-open-challenge-drawer').addEventListener('click', () => {
        document.getElementById('challenge-drawer').classList.remove('hidden');
        document.getElementById('challenge-reason').focus();
      });

      return;
    }

    let actionButtonsHTML = '';
    if (issue.status === 'Reported') {
      actionButtonsHTML = `
        <button type="button" class="btn btn-primary" id="btn-action-ack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Acknowledge Issue
        </button>
      `;
    } else if (issue.status === 'Acknowledged') {
      actionButtonsHTML = `
        <button type="button" class="btn btn-primary" id="btn-action-start">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          Start Action (In Progress)
        </button>
      `;
    } else if (issue.status === 'In Progress') {
      actionButtonsHTML = `
        <button type="button" class="btn btn-primary" id="btn-action-mark-fixed">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>
          Mark as Fixed (Submit After-Evidence)
        </button>
      `;
    }

    container.innerHTML = `
      <div class="action-strip">
        <span class="strip-label">Lifecycle Stage Action:</span>
        ${actionButtonsHTML}
      </div>
    `;

    if (document.getElementById('btn-action-ack')) {
      document.getElementById('btn-action-ack').addEventListener('click', () => {
        acknowledgeIssue(issue.id);
      });
    }

    if (document.getElementById('btn-action-start')) {
      document.getElementById('btn-action-start').addEventListener('click', () => {
        startActionIssue(issue.id);
      });
    }

    if (document.getElementById('btn-action-mark-fixed')) {
      document.getElementById('btn-action-mark-fixed').addEventListener('click', () => {
        document.getElementById('mark-fixed-drawer').classList.remove('hidden');
        document.getElementById('fix-work-note').focus();
      });
    }
  }

  function renderVolunteers(issue) {
    const list = document.getElementById('volunteers-list');
    const vols = issue.volunteers || appState.volunteers.filter(v => v.issueId === issue.id);

    if (!vols || vols.length === 0) {
      list.innerHTML = `<span class="text-sm text-muted">No watchers registered yet. Click "Volunteer for Follow-up" to monitor this issue.</span>`;
      return;
    }

    list.innerHTML = vols.map(v => `
      <span class="volunteer-pill">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ${escapeHTML(v.name)}
      </span>
    `).join('');
  }

  function renderTimeline(issue) {
    const container = document.getElementById('modal-timeline');
    const history = issue.createdHistory || [];

    if (history.length === 0) {
      container.innerHTML = `<div class="text-sm text-muted">No audit trail records available.</div>`;
      return;
    }

    container.innerHTML = history.map(item => `
      <div class="timeline-item">
        <div class="timeline-marker">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"/></svg>
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-badge">${escapeHTML(item.badge || item.status)}</span>
            <span class="timeline-time">${escapeHTML(item.timeLabel || 'Recent')}</span>
          </div>
          <p class="timeline-remark">${escapeHTML(item.remark)}</p>
          ${item.actor ? `<div class="timeline-actor">— by ${escapeHTML(item.actor)}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  // ==========================================================================
  // 7. MODALS & PROMPTS HANDLING
  // ==========================================================================

  function showDuplicateAlert(issue, oldScore, newScore) {
    const modal = document.getElementById('duplicate-modal');
    document.getElementById('duplicate-modal-msg').innerHTML =
      `Similar issue already exists in <strong>${escapeHTML(issue.location)}</strong> under <strong>${escapeHTML(issue.category)}</strong>.<br>Your report was automatically merged to Issue <strong>#${escapeHTML(issue.id)}</strong>!`;

    const callout = document.getElementById('duplicate-stats-callout');
    callout.innerHTML = `
      <div class="dup-stat-item">
        <span class="dup-stat-num">${issue.supports}</span>
        <span class="dup-stat-lbl">Community Supports</span>
      </div>
      <div class="dup-stat-item">
        <span class="dup-stat-num">${newScore}</span>
        <span class="dup-stat-lbl">Priority Score (+3)</span>
      </div>
      <div class="dup-stat-item">
        <span class="dup-stat-num">${issue.status}</span>
        <span class="dup-stat-lbl">Current Status</span>
      </div>
    `;

    document.getElementById('view-duplicate-issue-btn').onclick = function () {
      modal.classList.add('hidden');
      openIssueDetail(issue.id);
    };

    modal.classList.remove('hidden');
  }

  function openVerifyPromptModal() {
    const modal = document.getElementById('verify-modal');
    document.getElementById('verifier-name-input').value = '';
    document.getElementById('verifier-note-input').value = '';
    modal.classList.remove('hidden');
    document.getElementById('verifier-name-input').focus();
  }

  function openVolunteerPromptModal() {
    const modal = document.getElementById('volunteer-modal');
    document.getElementById('volunteer-name-input').value = '';
    modal.classList.remove('hidden');
    document.getElementById('volunteer-name-input').focus();
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================================================
  // 8. EVENT LISTENERS SETUP
  // ==========================================================================
  function setupEventListeners() {

    const locationSelect = document.getElementById('location-select');
    const customLocation = document.getElementById('custom-location');
    locationSelect.addEventListener('change', () => {
      if (locationSelect.value === 'CUSTOM') {
        customLocation.classList.remove('hidden');
        customLocation.required = true;
        customLocation.focus();
      } else {
        customLocation.classList.add('hidden');
        customLocation.required = false;
      }
    });

    const photoInput = document.getElementById('photo-input');
    const photoPreviewBox = document.getElementById('photo-preview-box');
    const photoPreviewImg = document.getElementById('photo-preview-img');
    const uploadDropzone = document.getElementById('upload-dropzone');
    const removePhotoBtn = document.getElementById('remove-photo-btn');

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          stagedBeforePhoto = event.target.result;
          photoPreviewImg.src = stagedBeforePhoto;
          photoPreviewBox.classList.remove('hidden');
          uploadDropzone.classList.add('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    removePhotoBtn.addEventListener('click', () => {
      stagedBeforePhoto = null;
      photoInput.value = '';
      photoPreviewBox.classList.add('hidden');
      uploadDropzone.classList.remove('hidden');
    });

    const reportForm = document.getElementById('report-form');
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const reporterName = document.getElementById('reporter-name').value.trim();
      const category = document.getElementById('category-select').value;
      let location = document.getElementById('location-select').value;
      if (location === 'CUSTOM') {
        location = customLocation.value.trim();
      }
      const title = document.getElementById('problem-title').value.trim();
      const description = document.getElementById('problem-desc').value.trim();
      const severity = document.getElementById('severity-select').value;
      const daysPending = document.getElementById('days-pending').value;

      if (!reporterName || !category || !location || !title) {
        showToast('Please fill in all required fields.', 'warning');
        return;
      }

      addReportAndCheckDuplicate({
        reporterName,
        category,
        location,
        title,
        description,
        severity,
        daysPending,
        beforeImage: stagedBeforePhoto,
        beforeLabel: `${title} (Original Report)`
      });

      reportForm.reset();
      customLocation.classList.add('hidden');
      stagedBeforePhoto = null;
      photoPreviewBox.classList.add('hidden');
      uploadDropzone.classList.remove('hidden');
    });

    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.trim();
      if (currentFilters.search) {
        clearSearchBtn.classList.remove('hidden');
      } else {
        clearSearchBtn.classList.add('hidden');
      }
      renderIssuesList();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentFilters.search = '';
      clearSearchBtn.classList.add('hidden');
      renderIssuesList();
    });

    document.querySelectorAll('#status-filters .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#status-filters .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilters.status = btn.dataset.filterValue;
        renderIssuesList();
      });
    });

    document.getElementById('category-filter').addEventListener('change', (e) => {
      currentFilters.category = e.target.value;
      renderIssuesList();
    });

    document.getElementById('severity-filter').addEventListener('change', (e) => {
      currentFilters.severity = e.target.value;
      renderIssuesList();
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      renderIssuesList();
    });

    document.getElementById('reset-filters-btn').addEventListener('click', () => {
      currentFilters = {
        status: 'ALL',
        category: 'ALL',
        severity: 'ALL',
        search: '',
        sort: 'priority'
      };
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      document.getElementById('category-filter').value = 'ALL';
      document.getElementById('severity-filter').value = 'ALL';
      document.getElementById('sort-select').value = 'priority';
      document.querySelectorAll('#status-filters .pill-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filterValue === 'ALL');
      });
      renderIssuesList();
    });

    document.getElementById('modal-close-btn').addEventListener('click', closeIssueDetail);
    document.getElementById('modal-bottom-close').addEventListener('click', closeIssueDetail);
    document.getElementById('detail-modal').addEventListener('click', (e) => {
      if (e.target.id === 'detail-modal') {
        closeIssueDetail();
      }
    });

    const afterPhotoInput = document.getElementById('after-photo-input');
    const afterPreviewBox = document.getElementById('after-photo-preview-box');
    const afterPreviewImg = document.getElementById('after-photo-preview-img');
    const afterUploadDropzone = document.getElementById('after-upload-dropzone');
    const removeAfterPhotoBtn = document.getElementById('remove-after-photo-btn');

    afterPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          stagedAfterPhoto = event.target.result;
          afterPreviewImg.src = stagedAfterPhoto;
          afterPreviewBox.classList.remove('hidden');
          afterUploadDropzone.classList.add('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    removeAfterPhotoBtn.addEventListener('click', () => {
      stagedAfterPhoto = null;
      afterPhotoInput.value = '';
      afterPreviewBox.classList.add('hidden');
      afterUploadDropzone.classList.remove('hidden');
    });

    document.getElementById('cancel-mark-fixed-btn').addEventListener('click', () => {
      document.getElementById('mark-fixed-drawer').classList.add('hidden');
    });

    document.getElementById('mark-fixed-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const workNote = document.getElementById('fix-work-note').value.trim();
      if (!workNote) {
        showToast('Please enter an action/repair summary.', 'warning');
        return;
      }
      markAsFixed(activeModalIssueId, workNote, stagedAfterPhoto);
      document.getElementById('mark-fixed-form').reset();
      stagedAfterPhoto = null;
      afterPreviewBox.classList.add('hidden');
      afterUploadDropzone.classList.remove('hidden');
      document.getElementById('mark-fixed-drawer').classList.add('hidden');
    });

    document.getElementById('cancel-challenge-btn').addEventListener('click', () => {
      document.getElementById('challenge-drawer').classList.add('hidden');
    });

    document.getElementById('challenge-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const challengerName = document.getElementById('challenger-name').value.trim();
      const challengeReason = document.getElementById('challenge-reason').value.trim();
      if (!challengerName || !challengeReason) {
        showToast('Please provide your name and challenge reason.', 'warning');
        return;
      }
      challengeIssue(activeModalIssueId, challengeReason, challengerName);
      document.getElementById('challenge-form').reset();
      document.getElementById('challenge-drawer').classList.add('hidden');
    });

    document.getElementById('cancel-verify-modal-btn').addEventListener('click', () => {
      document.getElementById('verify-modal').classList.add('hidden');
    });

    document.getElementById('verify-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const verifierName = document.getElementById('verifier-name-input').value.trim();
      const verifierNote = document.getElementById('verifier-note-input').value.trim();
      if (!verifierName) {
        showToast('Please provide your name to verify.', 'warning');
        return;
      }
      verifyIssue(activeModalIssueId, verifierName, verifierNote);
      document.getElementById('verify-modal').classList.add('hidden');
    });

    document.getElementById('volunteer-btn').addEventListener('click', openVolunteerPromptModal);
    document.getElementById('cancel-volunteer-btn').addEventListener('click', () => {
      document.getElementById('volunteer-modal').classList.add('hidden');
    });
    document.getElementById('volunteer-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const volName = document.getElementById('volunteer-name-input').value.trim();
      if (!volName) {
        showToast('Please enter your name.', 'warning');
        return;
      }
      addVolunteer(activeModalIssueId, volName);
      document.getElementById('volunteer-modal').classList.add('hidden');
    });

    document.getElementById('close-duplicate-modal-btn').addEventListener('click', () => {
      document.getElementById('duplicate-modal').classList.add('hidden');
    });

    document.getElementById('reset-demo-btn').addEventListener('click', () => {
      resetDemoData(true);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openBackdrops = document.querySelectorAll('.modal-backdrop:not(.hidden)');
        openBackdrops.forEach(modal => modal.classList.add('hidden'));
        document.body.style.overflow = '';
      }
    });
  }

  // ==========================================================================
  // 9. INITIALIZATION
  // ==========================================================================
  async function init() {
    setupEventListeners();
    await loadData();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
