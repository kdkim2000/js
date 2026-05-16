'use strict';

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../../data/registry.json');
const DATA_SITES_DIR = path.join(__dirname, '../../data/sites');

function readRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return { sites: [] };
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  } catch {
    return { sites: [] };
  }
}

function getSiteDataDir(siteId) {
  return path.join(DATA_SITES_DIR, siteId);
}

function getValidSiteIds() {
  return readRegistry().sites.map(s => s.id);
}

function validateSiteId(siteId) {
  if (!siteId || !/^[a-zA-Z0-9_-]+$/.test(siteId)) return false;
  return true;
}

module.exports = { readRegistry, getSiteDataDir, getValidSiteIds, validateSiteId };
