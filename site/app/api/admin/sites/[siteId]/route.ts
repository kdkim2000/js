import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import type { Registry } from '@/lib/registry';

const REGISTRY_PATH = path.join(process.cwd(), '..', 'data', 'registry.json');

function readRegistry(): Registry {
  if (!fs.existsSync(REGISTRY_PATH)) return { sites: [] };
  try { return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')); }
  catch { return { sites: [] }; }
}

function writeRegistry(data: Registry) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const registry = readRegistry();
  const site = registry.sites.find(s => s.id === siteId);
  if (!site) return NextResponse.json({ error: '사이트 없음' }, { status: 404 });
  return NextResponse.json(site);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const registry = readRegistry();
  const idx = registry.sites.findIndex(s => s.id === siteId);
  if (idx === -1) return NextResponse.json({ error: '사이트 없음' }, { status: 404 });
  registry.sites.splice(idx, 1);
  writeRegistry(registry);

  // data/sites/{siteId}/ 삭제
  const siteDir = path.join(process.cwd(), '..', 'data', 'sites', siteId);
  if (fs.existsSync(siteDir)) fs.rmSync(siteDir, { recursive: true, force: true });

  return NextResponse.json({ ok: true });
}
