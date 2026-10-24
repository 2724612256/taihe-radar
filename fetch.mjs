/* 太和殿 · 热榜抓取（独立仓库版）
   抓 微博 / 抖音 / B站 各前 5 条，写成一份「邸报」。
   产出：radar/latest.json 与 radar/editions/<日期>-<时段>.json
*/
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const OUT_DIR = path.join(ROOT, 'radar');
const ED_DIR = path.join(OUT_DIR, 'editions');

const PLATFORMS = [
  { key: 'weibo', name: '微博' },
  { key: 'douyin', name: '抖音' },
  { key: 'bilibili', name: 'B站' },
];
const TOP_N = 5;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const API = 'https://newsnow.busiyi.world/api/s?id=';

const bj = new Date(Date.now() + 8 * 3600 * 1000);
const pad = (n) => String(n).padStart(2, '0');
const date = `${bj.getUTCFullYear()}-${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())}`;
const hour = bj.getUTCHours();
const slot = hour < 11 ? 'morning' : hour < 15 ? 'noon' : 'evening';
const slotName = { morning: '早报', noon: '午报', evening: '晚报' }[slot];

async function fetchPlatform(p) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(`${API}${p.key}`, {
        headers: { 'user-agent': UA, accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = (data.items || []).slice(0, TOP_N).map((it, i) => ({
        rank: i + 1,
        title: String(it.title || '').slice(0, 200),
        url: String(it.url || it.mobileUrl || ''),
        hot: it.extra && (it.extra.info || it.extra.hot) ? String(it.extra.info || it.extra.hot).slice(0, 20) : '',
      }));
      if (!items.length) throw new Error('empty');
      return { key: p.key, name: p.name, items };
    } catch (err) {
      if (attempt === 2) {
        console.error(`[${p.name}] 抓取失败：${err.message}`);
        return { key: p.key, name: p.name, items: [], error: err.message };
      }
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  return { key: p.key, name: p.name, items: [] };
}

const platforms = [];
for (const p of PLATFORMS) {
  // eslint-disable-next-line no-await-in-loop
  platforms.push(await fetchPlatform(p));
}

const edition = {
  id: `ed_${date}_${slot}`,
  slot,
  slotName,
  date,
  at: new Date().toISOString(),
  platforms,
};

fs.mkdirSync(ED_DIR, { recursive: true });
fs.writeFileSync(path.join(ED_DIR, `${date}-${slot}.json`), `${JSON.stringify(edition, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'latest.json'), `${JSON.stringify({ version: 1, generatedAt: edition.at, edition }, null, 2)}\n`, 'utf8');

const total = platforms.reduce((n, p) => n + p.items.length, 0);
console.log(`已生成 ${slotName}（${date}）：${platforms.map((p) => `${p.name} ${p.items.length}`).join(' / ')}，共 ${total} 条`);
