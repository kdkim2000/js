import path from 'path';
import fs from 'fs';

export interface CrawlConfig {
  contentSelector?: string;
  strategy?: 'sitemap' | 'bfs';
  maxDepth?: number;
  delayMs?: number;
  userAgent?: string;
}

export interface SiteEntry {
  id: string;
  name: string;
  url: string;
  description?: string;
  addedAt: string;
  lastCrawledAt?: string;
  crawlStatus: 'pending' | 'running' | 'done' | 'error';
  totalArticles?: number;
  crawlConfig?: CrawlConfig;
}

export interface Registry {
  sites: SiteEntry[];
}

export function getSiteDataDir(siteId: string): string {
  return path.join(process.cwd(), '..', 'data', 'sites', siteId);
}

export function getRegistry(): Registry {
  const registryPath = path.join(process.cwd(), '..', 'data', 'registry.json');
  if (!fs.existsSync(registryPath)) {
    return { sites: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(registryPath, 'utf8')) as Registry;
  } catch {
    return { sites: [] };
  }
}

export function getSite(id: string): SiteEntry | null {
  const registry = getRegistry();
  return registry.sites.find(s => s.id === id) ?? null;
}
