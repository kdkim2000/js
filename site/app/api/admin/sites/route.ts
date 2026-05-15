export const dynamic = 'force-static';

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
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  return NextResponse.json(readRegistry());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, id, name, crawlConfig } = body;
    if (!url || !id) return NextResponse.json({ error: 'url, id 필수' }, { status: 400 });

    const registry = readRegistry();
    if (registry.sites.find(s => s.id === id)) {
      return NextResponse.json({ error: '이미 등록된 사이트 ID' }, { status: 409 });
    }

    const now = new Date().toISOString();
    registry.sites.push({ id, name: name || id, url, addedAt: now, crawlStatus: 'pending', crawlConfig });
    writeRegistry(registry);

    // data/sites/{id}/ 디렉토리 생성
    const siteDir = path.join(process.cwd(), '..', 'data', 'sites', id);
    fs.mkdirSync(siteDir, { recursive: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId');
  if (!siteId) return NextResponse.json({ error: 'siteId 필수' }, { status: 400 });

  const registry = readRegistry();
  const idx = registry.sites.findIndex(s => s.id === siteId);
  if (idx === -1) return NextResponse.json({ error: '사이트 없음' }, { status: 404 });
  registry.sites.splice(idx, 1);
  writeRegistry(registry);

  const siteDir = path.join(process.cwd(), '..', 'data', 'sites', siteId);
  if (fs.existsSync(siteDir)) fs.rmSync(siteDir, { recursive: true, force: true });

  return NextResponse.json({ ok: true });
}
