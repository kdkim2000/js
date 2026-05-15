export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import type { Registry } from '@/lib/registry';

const REGISTRY_PATH = path.join(process.cwd(), '..', 'data', 'registry.json');
const CRAWL_JS = path.join(process.cwd(), '..', 'crawler', 'generic', 'crawl.js');

function readRegistry(): Registry {
  if (!fs.existsSync(REGISTRY_PATH)) return { sites: [] };
  try { return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')); }
  catch { return { sites: [] }; }
}

export async function POST(req: NextRequest) {
  let siteId: string | null = null;
  let statusOnly = false;
  try {
    const body = await req.json();
    siteId = body.siteId ?? null;
    statusOnly = body.statusOnly ?? false;
  } catch { /* no body */ }
  if (!siteId) return NextResponse.json({ error: 'siteId 필수' }, { status: 400 });

  if (statusOnly) {
    const statusPath = path.join(process.cwd(), '..', 'data', 'sites', '.crawl-status', `${siteId}.json`);
    if (!fs.existsSync(statusPath)) {
      return NextResponse.json({ type: 'progress', phase: 'discover', done: 0, total: 0, errors: 0 });
    }
    try {
      const s = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      if (s.status === 'done') return NextResponse.json({ type: 'done', totalArticles: s.progress?.done ?? 0 });
      if (s.status === 'error') return NextResponse.json({ type: 'error', message: s.errorMessage ?? '오류' });
      return NextResponse.json({ type: 'progress', phase: s.phase ?? 'running', done: s.progress?.done ?? 0, total: s.progress?.total ?? 0, errors: s.progress?.errors ?? 0 });
    } catch {
      return NextResponse.json({ type: 'progress', phase: 'discover', done: 0, total: 0, errors: 0 });
    }
  }

  const registry = readRegistry();
  const site = registry.sites.find(s => s.id === siteId);
  if (!site) return NextResponse.json({ error: '사이트 없음' }, { status: 404 });

  const args = [
    CRAWL_JS,
    `--url=${site.url}`,
    `--id=${site.id}`,
    `--name=${site.name}`,
  ];
  if (site.crawlConfig?.contentSelector) args.push(`--selector=${site.crawlConfig.contentSelector}`);
  if (site.crawlConfig?.strategy) args.push(`--strategy=${site.crawlConfig.strategy}`);
  if (site.crawlConfig?.maxDepth) args.push(`--maxDepth=${site.crawlConfig.maxDepth}`);
  if (site.crawlConfig?.delayMs) args.push(`--delay=${site.crawlConfig.delayMs}`);

  spawn(process.execPath, args, { detached: false, stdio: 'ignore' }).unref();
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const siteId = new URL(req.url).searchParams.get('siteId');
  if (!siteId) return NextResponse.json({ error: 'siteId 필수' }, { status: 400 });

  const statusPath = path.join(process.cwd(), '..', 'data', 'sites', '.crawl-status', `${siteId}.json`);

  if (!fs.existsSync(statusPath)) {
    return NextResponse.json({ type: 'progress', phase: 'discover', done: 0, total: 0, errors: 0 });
  }

  try {
    const s = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    if (s.status === 'done') {
      return NextResponse.json({ type: 'done', totalArticles: s.progress?.done ?? 0 });
    } else if (s.status === 'error') {
      return NextResponse.json({ type: 'error', message: s.errorMessage ?? '알 수 없는 오류' });
    } else {
      return NextResponse.json({
        type: 'progress',
        phase: s.phase ?? 'running',
        done: s.progress?.done ?? 0,
        total: s.progress?.total ?? 0,
        errors: s.progress?.errors ?? 0,
      });
    }
  } catch {
    return NextResponse.json({ type: 'progress', phase: 'discover', done: 0, total: 0, errors: 0 });
  }
}
