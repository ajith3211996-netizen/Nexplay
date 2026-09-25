/**
 * version_manager.js
 * Automated Semantic & Lengthy Version Management for NexPlay
 * Handles Major, Minor, Patch, Bug/Issue, and Build increments across:
 * - version.json
 * - app.json
 * - package.json
 * - android/app/build.gradle
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const VERSION_FILE = path.join(ROOT_DIR, 'version.json');
const BACKUP_FILE = path.join(ROOT_DIR, '.version_backup.json');
const APP_JSON_FILE = path.join(ROOT_DIR, 'app.json');
const PKG_JSON_FILE = path.join(ROOT_DIR, 'package.json');

function padZero(num, size = 2) {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}

function getDateCode() {
  const d = new Date();
  const year = d.getFullYear();
  const month = padZero(d.getMonth() + 1);
  const day = padZero(d.getDate());
  return `${year}${month}${day}`;
}

function readVersion() {
  if (!fs.existsSync(VERSION_FILE)) {
    return {
      major: 1,
      minor: 0,
      patch: 8,
      issue: 1,
      build: 108,
      updateType: 'bugfix',
      timestamp: getDateCode(),
      versionName: `1.0.8.1.108-bugfix.${getDateCode()}`,
      versionCode: 1080108,
      lastSuccessfulBuild: null,
      history: []
    };
  }
  return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
}

function bumpVersion(type = 'bug', note = '') {
  const current = readVersion();

  // Save backup for rollback if build fails
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(current, null, 2), 'utf8');

  let major = current.major || 1;
  let minor = current.minor || 0;
  let patch = current.patch || 8;
  let issue = current.issue || 1;
  let build = (current.build || 100) + 1;
  let updateType = 'bugfix';

  const normalizedType = (type || 'bug').toLowerCase();
  switch (normalizedType) {
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      issue = 0;
      updateType = 'major';
      break;
    case 'minor':
      minor++;
      patch = 0;
      issue = 0;
      updateType = 'minor';
      break;
    case 'patch':
      patch++;
      issue = 0;
      updateType = 'patch';
      break;
    case 'bug':
    case 'bugfix':
      issue++;
      updateType = 'bugfix';
      break;
    case 'issue':
      issue++;
      updateType = 'issue';
      break;
    default:
      updateType = normalizedType;
      break;
  }

  const dateCode = getDateCode();
  // Lengthy version format: <Major>.<Minor>.<Patch>.<Issue>.<Build>-<UpdateType>.<DateCode>
  // e.g., 1.0.8.1.109-bugfix.20260924
  const versionName = `${major}.${minor}.${patch}.${issue}.${build}-${updateType}.${dateCode}`;
  
  // versionCode calculation: fits comfortably within Android integer limit (max 2.1B)
  const versionCode = parseInt((major * 1000000) + (minor * 100000) + (patch * 10000) + (build % 10000), 10);

  const updated = {
    ...current,
    major,
    minor,
    patch,
    issue,
    build,
    updateType,
    timestamp: dateCode,
    versionName,
    versionCode,
    pendingNote: note || ''
  };

  fs.writeFileSync(VERSION_FILE, JSON.stringify(updated, null, 2), 'utf8');
  syncConfig(versionName);

  console.log(`\x1b[32m[VersionManager]\x1b[0m Version staged (${updateType}): ${versionName} (Code: ${versionCode})`);
  return updated;
}

function syncConfig(versionName) {
  // Sync app.json if present
  if (fs.existsSync(APP_JSON_FILE)) {
    try {
      const appJson = JSON.parse(fs.readFileSync(APP_JSON_FILE, 'utf8'));
      if (appJson.expo) {
        appJson.expo.version = versionName;
        fs.writeFileSync(APP_JSON_FILE, JSON.stringify(appJson, null, 2), 'utf8');
      }
    } catch (e) {
      console.error('Error syncing app.json:', e.message);
    }
  }

  // Sync package.json if present
  if (fs.existsSync(PKG_JSON_FILE)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(PKG_JSON_FILE, 'utf8'));
      pkg.version = versionName;
      fs.writeFileSync(PKG_JSON_FILE, JSON.stringify(pkg, null, 2), 'utf8');
    } catch (e) {
      console.error('Error syncing package.json:', e.message);
    }
  }
}

function recordSuccess(note = '') {
  const current = readVersion();
  const buildRecord = {
    versionName: current.versionName,
    versionCode: current.versionCode,
    updateType: current.updateType,
    build: current.build,
    note: note || current.pendingNote || 'Successful build',
    builtAt: new Date().toISOString()
  };

  current.lastSuccessfulBuild = buildRecord.builtAt;
  if (!Array.isArray(current.history)) {
    current.history = [];
  }
  current.history.unshift(buildRecord);
  // Keep last 50 build records
  if (current.history.length > 50) current.history.length = 50;
  delete current.pendingNote;

  fs.writeFileSync(VERSION_FILE, JSON.stringify(current, null, 2), 'utf8');
  if (fs.existsSync(BACKUP_FILE)) {
    fs.unlinkSync(BACKUP_FILE);
  }
  console.log(`\x1b[32m[VersionManager]\x1b[0m Successfully committed build: ${current.versionName}`);
  return current;
}

function revert() {
  if (fs.existsSync(BACKUP_FILE)) {
    const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    fs.writeFileSync(VERSION_FILE, JSON.stringify(backup, null, 2), 'utf8');
    syncConfig(backup.versionName);
    fs.unlinkSync(BACKUP_FILE);
    console.log(`\x1b[33m[VersionManager]\x1b[0m Build failed: Reverted back to ${backup.versionName}`);
    return backup;
  }
  console.log('[VersionManager] No backup found to revert.');
  return null;
}

// CLI Handling
if (require.main === module) {
  const command = process.argv[2] || 'current';
  const arg1 = process.argv[3] || '';
  const arg2 = process.argv[4] || '';

  if (command === 'bump') {
    bumpVersion(arg1, arg2);
  } else if (command === 'success') {
    recordSuccess(arg1);
  } else if (command === 'revert') {
    revert();
  } else {
    const curr = readVersion();
    console.log(JSON.stringify(curr, null, 2));
  }
}

module.exports = {
  readVersion,
  bumpVersion,
  recordSuccess,
  revert,
  syncConfig
};
