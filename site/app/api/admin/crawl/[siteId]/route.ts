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

export async function POST(_req: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const statusPath = path.join(process.cwd(), '..', 'data', 'sites', '.crawl-status', `${siteId}.json`);

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (data: object) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = setInterval(() => {
        if (!fs.existsSync(statusPath)) {
          send({ type: 'progress', phase: 'discover', done: 0, total: 0, errors: 0 });
          return;
        }
        try {
          const s = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
          if (s.status === 'done') {
            send({ type: 'done', totalArticles: s.progress?.done ?? 0 });
            clearInterval(poll);
            controller.close();
          } else if (s.status === 'error') {
            send({ type: 'error', message: s.errorMessage ?? '알 수 없는 오류' });
            clearInterval(poll);
            controller.close();
          } else {
            send({
              type: 'progress',
              phase: s.phase ?? 'running',
              done: s.progress?.done ?? 0,
              total: s.progress?.total ?? 0,
              errors: s.progress?.errors ?? 0,
            });
          }
        } catch { /* skip */ }
      }, 500);

      // 5분 타임아웃
      setTimeout(() => {
        clearInterval(poll);
        controller.close();
      }, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
