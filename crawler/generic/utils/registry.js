'use strict';

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../../../data/registry.json');
const DATA_SITES_DIR = path.join(__dirname, '../../../data/sites');

function readRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return { sites: [] };
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  } catch {
    return { sites: [] };
  }
}

function writeRegistry(data) {
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getSiteDataDir(siteId) {
  return path.join(DATA_SITES_DIR, siteId);
}

function upsertSite(siteEntry) {
  const registry = readRegistry();
  const idx = registry.sites.findIndex(s => s.id === siteEntry.id);
  if (idx >= 0) {
    registry.sites[idx] = { ...registry.sites[idx], ...siteEntry };
  } else {
    registry.sites.push(siteEntry);
  }
  writeRegistry(registry);
}

function updateCrawlStatus(siteId, status, extra = {}) {
  const registry = readRegistry();
  const site = registry.sites.find(s => s.id === siteId);
  if (site) {
    site.crawlStatus = status;
    if (status === 'done') site.lastCrawledAt = new Date().toISOString();
    Object.assign(site, extra);
    writeRegistry(registry);
  }
}

function getValidSiteIds() {
  return readRegistry().sites.map(s => s.id);
}

module.exports = { readRegistry, writeRegistry, getSiteDataDir, upsertSite, updateCrawlStatus, getValidSiteIds };
