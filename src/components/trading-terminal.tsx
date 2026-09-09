import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, CandlestickChart, Crosshair, Grid3X3, Minus, Plus, RotateCcw, TrendingDown, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Side = "BUY" | "SELL";
type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
type Pos = { id: number; side: Side; volume: number; entry: number; sl: number | null; tp: number | null; openedAt: number };
type Quote = { symbol: string; price: number; change: number; change_pct: number; open: number; high: number; low: number; previous_close: number; timestamp: string; source: string; is_delayed: boolean };
type Asset = { symbol: string; digits: number; point: number; contract: number };

const ASSETS: Asset[] = [
  { symbol: "EURUSD", digits: 5, point: 0.00001, contract: 100000 },
  { symbol: "GBPUSD", digits: 5, point: 0.00001, contract: 100000 },
  { symbol: "USDJPY", digits: 3, point: 0.001, contract: 100000 },
  { symbol: "XAUUSD", digits: 2, point: 0.01, contract: 100 },
  { symbol: "BTCUSD", digits: 2, point: 0.01, contract: 1 },
  { symbol: "AAPL", digits: 2, point: 0.01, contract: 100 },
  { symbol: "NVDA", digits: 2, point: 0.01, contract: 100 },
  { symbol: "SPY", digits: 2, point: 0.01, contract: 100 },
  { symbol: "QQQ", digits: 2, point: 0.01, contract: 100 },
];
const TFS = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];
const INDS = ["EMA 20", "SMA 20", "RSI 14", "MACD", "Bollinger Bands", "ATR 14", "VWAP", "ADX 14"];
const TFSEC: Record<string, number> = { M1: 60, M5: 300, M15: 900, M30: 1800, H1: 3600, H4: 14400, D1: 86400, W1: 604800, MN: 2592000 };
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function seedCandles(price: number, point: number, count = 140): Candle[] {
  let p = price;
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const o = p;
    const amp = Math.max(point * 4, Math.abs(p) * 0.0007);
    const move = (Math.sin(i * 0.41) + Math.cos(i * 0.13)) * 0.17 * amp + (Math.random() - 0.5) * amp * 0.8;
    const c = Math.max(point, p + move);
    const h = Math.max(o, c) + Math.abs(move) * 0.7 + point * 2;
    const l = Math.min(o, c) - Math.abs(move) * 0.7 - point * 2;
    p = c;
    return { t: now - (count - i) * 60000, o, h, l, c, v: Math.round(500 + Math.random() * 2500) };
  });
}
function ema(xs: number[], n: number) { const k = 2 / (n + 1); let e = xs[0] ?? 0; return xs.map((x, i) => i ? (e = x * k + e * (1 - k)) : e); }
function sma(xs: number[], n: number) { return xs.map((_, i) => i < n - 1 ? null : xs.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n); }
function rsi(xs: number[], n = 14) { return xs.map((_, i) => { if (i < n) return null; let up = 0, dn = 0; for (let j = i - n + 1; j <= i; j++) { const d = xs[j] - xs[j - 1]; if (d > 0) up += d; else dn -= d; } return dn === 0 ? 100 : 100 - 100 / (1 + up / dn); }); }
function boll(xs: number[], n = 20, m = 2) { return xs.map((_, i) => { if (i < n - 1) return null; const a = xs.slice(i - n + 1, i + 1), s = a.reduce((u, x) => u + x, 0) / n, sd = Math.sqrt(a.reduce((u, x) => u + (x - s) ** 2, 0) / n); return { mid: s, up: s + m * sd, lo: s - m * sd }; }); }
function atr(cs: Candle[], n = 14) { return cs.map((_, i) => { if (i < n) return null; let tr = 0; for (let j = i - n + 1; j <= i; j++) tr += Math.max(cs[j].h - cs[j].l, Math.abs(cs[j].h - cs[j - 1].c), Math.abs(cs[j].l - cs[j - 1].c)); return tr / n; }); }
function macd(xs: number[]) { const f = ema(xs, 12), s = ema(xs, 26), line = xs.map((_, i) => f[i] - s[i]), sig = ema(line, 9); return { line, sig }; }
function adx(cs: Candle[], n = 14) { const out: (number | null)[] = []; for (let i = 0; i < cs.length; i++) { if (i < n) { out.push(null); continue; } let tr = 0, pdm = 0, mdm = 0; for (let j = i - n + 1; j <= i; j++) { const up = cs[j].h - cs[j - 1].h, down = cs[j - 1].l - cs[j].l; tr += Math.max(cs[j].h - cs[j].l, Math.abs(cs[j].h - cs[j - 1].c), Math.abs(cs[j].l - cs[j - 1].c)); if (up > down && up > 0) pdm += up; if (down > up && down > 0) mdm += down; } const pdi = tr ? pdm / tr * 100 : 0, mdi = tr ? mdm / tr * 100 : 0; out.push(pdi + mdi ? Math.abs(pdi - mdi) / (pdi + mdi) * 100 : 0); } return out; }
function vwap(cs: Candle[]) { let pv = 0, vol = 0; return cs.map(c => { const tp = (c.h + c.l + c.c) / 3; pv += tp * c.v; vol += c.v; return pv / vol; }); }

export function TradingTerminal() {
  const [assetIndex, setAssetIndex] = useState(0); const asset = ASSETS[assetIndex];
  const [quotes, setQuotes] = useState<Record<string, Quote>>({}); const [status, setStatus] = useState("Připojování k trhu…");
  const [timeframe, setTimeframe] = useState("M15"); const [candles, setCandles] = useState<Candle[]>([]); const [positions, setPositions] = useState<Pos[]>([]); const [history, setHistory] = useState<Array<Pos & { exit: number; pnl: number; closedAt: number }>>([]);
  const [balance, setBalance] = useState(10000); const [volume, setVolume] = useState(0.1); const [slPts, setSlPts] = useState(250); const [tpPts, setTpPts] = useState(500); const [inds, setInds] = useState<string[]>(["EMA 20", "RSI 14"]); const [bottom, setBottom] = useState("Trade"); const [grid, setGrid] = useState(true); const [cross, setCross] = useState(false); const [visible, setVisible] = useState(80); const [toast, setToast] = useState("");
  const timer = useRef<number>();
  const quote = quotes[asset.symbol]; const livePrice = quote?.price ?? candles.at(-1)?.c ?? 0;
  const prices = candles.map(c => c.c), E = ema(prices, 20), S = sma(prices, 20), R = rsi(prices), B = boll(prices), A = atr(candles), M = macd(prices), AD = adx(candles), V = vwap(candles);
  const pnl = useMemo(() => positions.reduce((sum, p) => { const delta = p.side === "BUY" ? livePrice - p.entry : p.entry - livePrice; const fx = asset.symbol === "USDJPY" ? 0.0068 : 1; return sum + delta * p.volume * asset.contract * fx; }, 0), [positions, livePrice, asset]);
  const equity = balance + pnl;

  const fetchQuotes = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("market-quotes-v2", { body: null });
      if (error) throw error;
      const qs = (data?.quotes ?? []) as Quote[];
      setQuotes(Object.fromEntries(qs.map(q => [q.symbol, q])));
      setStatus(data?.delayed ? "LIVE FEED • zpoždění zdroje" : "LIVE FEED");
    } catch { setStatus("LIVE FEED nedostupný • fallback simulace"); }
  }, []);
  useEffect(() => { fetchQuotes(); timer.current = window.setInterval(fetchQuotes, 15000); return () => timer.current && window.clearInterval(timer.current); }, [fetchQuotes]);
  useEffect(() => {
    const p = quote?.price; if (!p) return;
    setCandles(prev => {
      if (!prev.length) return seedCandles(p, asset.point);
      const last = prev.at(-1)!; const step = TFSEC[timeframe] * 1000; const bucket = Math.floor(Date.now() / step) * step;
      if (bucket === last.t) { const arr = [...prev]; arr[arr.length - 1] = { ...arr.at(-1)!, c: p, h: Math.max(arr.at(-1)!.h, p), l: Math.min(arr.at(-1)!.l, p) }; return arr.slice(-240); }
      return [...prev, { t: bucket, o: last.c, h: Math.max(last.c, p), l: Math.min(last.c, p), c: p, v: Math.round(500 + Math.random() * 2500) }].slice(-240);
    });
  }, [quote?.price, asset.point, timeframe]);
  useEffect(() => { if (!candles.length && quote?.price) setCandles(seedCandles(quote.price, asset.point)); }, [quote?.price, asset.point, candles.length]);
  useEffect(() => { setPositions([]); setHistory([]); if (quote?.price) setCandles(seedCandles(quote.price, asset.point)); }, [assetIndex]);

  const closePosition = useCallback((id: number, auto = false) => {
    const p = positions.find(x => x.id === id); if (!p) return;
    const delta = p.side === "BUY" ? livePrice - p.entry : p.entry - livePrice; const fx = asset.symbol === "USDJPY" ? 0.0068 : 1; const result = delta * p.volume * asset.contract * fx;
    setBalance(b => b + result); setPositions(v => v.filter(x => x.id !== id)); setHistory(h => [{ ...p, exit: livePrice, pnl: result, closedAt: Date.now() }, ...h].slice(0, 100)); setToast(`${auto ? "SL/TP" : "Pozice"} uzavřena: ${result >= 0 ? "+" : ""}${result.toFixed(2)} USD`);
  }, [positions, livePrice, asset]);
  useEffect(() => { positions.forEach(p => { const hit = p.side === "BUY" ? (!!p.sl && livePrice <= p.sl) || (!!p.tp && livePrice >= p.tp) : (!!p.sl && livePrice >= p.sl) || (!!p.tp && livePrice <= p.tp); if (hit) closePosition(p.id, true); }); }, [livePrice, closePosition]);
  function open(side: Side) { if (!livePrice) return setToast("Čekám na live cenu…"); const sl = slPts > 0 ? (side === "BUY" ? livePrice - slPts * asset.point : livePrice + slPts * asset.point) : null; const tp = tpPts > 0 ? (side === "BUY" ? livePrice + tpPts * asset.point : livePrice - tpPts * asset.point) : null; setPositions(v => [...v, { id: Date.now(), side, volume, entry: livePrice, sl, tp, openedAt: Date.now() }]); setToast(`${side} ${volume.toFixed(2)} lot • ${fmt(livePrice, asset.digits)}`); }
  function reset() { setBalance(10000); setPositions([]); setHistory([]); setToast("Demo účet resetován"); }
  const shown = candles.slice(-visible); const W = 1200, H = 530, pad = 42; const hi = Math.max(...shown.map(c => c.h), livePrice || 0), lo = Math.min(...shown.map(c => c.l), livePrice || 0), range = Math.max(hi - lo, asset.point * 50), sx = (W - 2 * pad) / Math.max(1, shown.length); const x = (i: number) => pad + sx * i + sx / 2, y = (v: number) => H - pad - (v - lo) / range * (H - 2 * pad);
  const lines = (arr: (number | null)[], stroke: string, width = 2) => <polyline points={arr.slice(-visible).map((v, i) => v == null ? "" : `${x(i)},${y(v)}`).filter(Boolean).join(" ")} fill="none" stroke={stroke} strokeWidth={width} />;
  const toggle = (i: string) => setInds(v => v.includes(i) ? v.filter(x => x !== i) : [...v, i]);

  return <div className="overflow-hidden rounded-lg border border-white/10 bg-[#15171d] text-slate-200 shadow-2xl">
    <div className="flex items-center justify-between border-b border-white/10 bg-[#20232a] px-3 py-2 text-xs"><span className="flex items-center gap-2"><CandlestickChart className="size-4 text-yellow-300" /><b>Trading Academy • Trading Lab</b></span><span className="flex items-center gap-2 text-emerald-300"><span className="animate-pulse">●</span>{status}</span></div>
    <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#1b1e24] p-1 text-[10px]">{["Soubor", "Zobrazit", "Vložit", "Grafy", "Nástroje", "Okno"].map(x => <button key={x} className="rounded px-2 py-1.5 hover:bg-white/10">{x}</button>)}<span className="mx-1 h-4 w-px bg-white/10" /><button onClick={() => setCross(v => !v)} className="rounded p-1.5 hover:bg-white/10"><Crosshair className="size-3.5" /></button><button onClick={() => setGrid(v => !v)} className="rounded p-1.5 hover:bg-white/10"><Grid3X3 className="size-3.5" /></button><button onClick={() => setVisible(v => Math.max(30, v - 15))} className="rounded p-1.5 hover:bg-white/10"><Minus className="size-3.5" /></button><button onClick={() => setVisible(v => Math.min(160, v + 15))} className="rounded p-1.5 hover:bg-white/10"><Plus className="size-3.5" /></button><button onClick={reset} className="rounded p-1.5 hover:bg-white/10"><RotateCcw className="size-3.5" /></button></div>
    <div className="grid lg:grid-cols-[230px_1fr]">
      <aside className="hidden border-r border-white/10 bg-[#17191f] lg:block"><div className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500">Market Watch</div>{ASSETS.map((a, i) => { const q = quotes[a.symbol]; return <button key={a.symbol} onClick={() => setAssetIndex(i)} className={`grid w-full grid-cols-[1fr_auto] border-b border-white/5 px-3 py-2 text-left text-xs hover:bg-white/5 ${i === assetIndex ? "bg-yellow-400/10" : ""}`}><span className="font-semibold">{a.symbol}<small className="ml-1 text-[9px] text-slate-500">{q?.change_pct != null ? `${q.change_pct >= 0 ? "+" : ""}${q.change_pct.toFixed(2)}%` : "—"}</small></span><span>{q ? fmt(q.price, a.digits) : "…"}</span></button>; })}<div className="border-y border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500">Indicators</div>{INDS.map(i => <button key={i} onClick={() => toggle(i)} className={`w-full px-3 py-2 text-left text-xs ${inds.includes(i) ? "text-yellow-300" : "text-slate-400"}`}>▸ {i}</button>)}</aside>
      <main className="min-w-0">
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#1a1d23] p-1">{TFS.map(tf => <button key={tf} onClick={() => setTimeframe(tf)} className={`rounded px-2 py-1 text-[10px] ${tf === timeframe ? "bg-yellow-300 font-semibold text-black" : "text-slate-500 hover:bg-white/10"}`}>{tf}</button>)}<span className="ml-auto px-2 text-[10px] text-slate-500">{asset.symbol} • <b className="text-slate-200">{livePrice ? fmt(livePrice, asset.digits) : "…"}</b></span></div>
        <div className="border-b border-white/10 bg-[#0d1015] p-2"><div className="mb-1 flex flex-wrap gap-1">{INDS.map(i => <button key={i} onClick={() => toggle(i)} className={`rounded border px-2 py-1 text-[10px] ${inds.includes(i) ? "border-yellow-300/50 text-yellow-300" : "border-white/10 text-slate-500"}`}>{i}</button>)}<span className="ml-auto text-[10px] text-slate-500">RSI {R.at(-1)?.toFixed(1) ?? "—"} • ATR {A.at(-1)?.toFixed(asset.digits) ?? "—"} • ADX {AD.at(-1)?.toFixed(1) ?? "—"}</span></div><div className="overflow-x-auto"><svg viewBox={`0 0 ${W} ${H}`} className="h-[530px] min-w-[780px] w-full select-none">{grid && [0, .2, .4, .6, .8, 1].map(t => <line key={t} x1={pad} x2={W - pad} y1={pad + t * (H - 2 * pad)} y2={pad + t * (H - 2 * pad)} stroke="currentColor" opacity=".06" />)}{shown.map((c, i) => <g key={c.t} className={c.c >= c.o ? "text-emerald-400" : "text-red-400"}><line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke="currentColor" opacity=".85" /><rect x={x(i) - Math.max(2, sx * .28)} y={Math.min(y(c.o), y(c.c))} width={Math.max(3, sx * .56)} height={Math.max(2, Math.abs(y(c.c) - y(c.o)))} fill="currentColor" rx="1" /></g>)}{inds.includes("EMA 20") && lines(E, "#facc15", 2)}{inds.includes("SMA 20") && lines(S, "#60a5fa", 1.5)}{inds.includes("VWAP") && lines(V, "#22d3ee", 1.5)}{inds.includes("Bollinger Bands") && <>{lines(B.map(v => v?.up ?? null), "#a78bfa", 1)}{lines(B.map(v => v?.mid ?? null), "#8b5cf6", 1)}{lines(B.map(v => v?.lo ?? null), "#a78bfa", 1)}</>}{livePrice && <line x1={pad} x2={W - pad} y1={y(livePrice)} y2={y(livePrice)} stroke="#facc15" strokeDasharray="4 3" />}{positions.map(p => <g key={p.id}>{p.sl && <line x1={pad} x2={W - pad} y1={y(p.sl)} y2={y(p.sl)} stroke="#ef4444" strokeDasharray="5 5" opacity=".55" />}{p.tp && <line x1={pad} x2={W - pad} y1={y(p.tp)} y2={y(p.tp)} stroke="#22c55e" strokeDasharray="5 5" opacity=".55" />}</g>)}{cross && <><line x1={W / 2} x2={W / 2} y1={pad} y2={H - pad} stroke="white" opacity=".2" /><line x1={pad} x2={W - pad} y1={H / 2} y2={H / 2} stroke="white" opacity=".2" /></>}</svg></div></div>
        <div className="grid grid-cols-2 border-b border-white/10 bg-[#171a20] sm:grid-cols-5">{[["Balance", `$${balance.toFixed(2)}`], ["Equity", `$${equity.toFixed(2)}`], ["Margin", `$${(positions.length * volume * 100).toFixed(2)}`], ["P/L", `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`], ["Positions", String(positions.length)]].map(([k, v]) => <div key={k} className="border-r border-white/5 px-3 py-2"><div className="text-[9px] uppercase text-slate-500">{k}</div><div className={`mt-1 text-xs font-semibold ${k === "P/L" ? (pnl >= 0 ? "text-emerald-300" : "text-red-300") : ""}`}>{v}</div></div>)}</div>
        <div className="grid gap-2 border-b border-white/10 bg-[#1b1e24] p-2 md:grid-cols-[1fr_360px]"><div className="grid grid-cols-2 gap-2"><Button onClick={() => open("SELL")} className="h-12 bg-red-500/10 text-red-300 hover:bg-red-500/20"><TrendingDown className="size-4" /> SELL <span className="ml-auto">{livePrice ? fmt(livePrice - asset.point * 2, asset.digits) : "…"}</span></Button><Button onClick={() => open("BUY")} className="h-12 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"><TrendingUp className="size-4" /> BUY <span className="ml-auto">{livePrice ? fmt(livePrice + asset.point * 2, asset.digits) : "…"}</span></Button></div><div className="grid grid-cols-3 gap-2"><label className="text-[10px] text-slate-500">Objem<Input value={volume} onChange={e => setVolume(Math.max(.01, Number(e.target.value) || .01))} type="number" step=".01" className="mt-1 h-8 bg-[#0f1217] text-xs" /></label><label className="text-[10px] text-slate-500">SL pts<Input value={slPts} onChange={e => setSlPts(Math.max(0, Number(e.target.value) || 0))} type="number" className="mt-1 h-8 bg-[#0f1217] text-xs" /></label><label className="text-[10px] text-slate-500">TP pts<Input value={tpPts} onChange={e => setTpPts(Math.max(0, Number(e.target.value) || 0))} type="number" className="mt-1 h-8 bg-[#0f1217] text-xs" /></label></div></div>
        <div className="border-b border-white/10 bg-[#13161b]"><div className="flex items-center gap-4 px-3 text-[11px]">{["Trade", "Exposure", "History", "News", "Alerts", "Journal"].map(t => <button key={t} onClick={() => setBottom(t)} className={`border-b-2 py-2 ${bottom === t ? "border-yellow-300 text-yellow-300" : "border-transparent text-slate-500"}`}>{t}</button>)}<span className="ml-auto text-slate-600"><Activity className="mr-1 inline size-3" />{quote?.timestamp ? new Date(quote.timestamp).toLocaleTimeString("cs-CZ") : "—"}</span></div><div className="max-h-48 overflow-auto">{bottom === "Trade" && <table className="w-full text-[10px]"><thead className="sticky top-0 bg-[#13161b] text-slate-500"><tr><th className="p-2 text-left">Symbol</th><th>Side</th><th>Vol</th><th>Entry</th><th>SL</th><th>TP</th><th>P/L</th><th /></tr></thead><tbody>{positions.map(p => { const pp = (p.side === "BUY" ? livePrice - p.entry : p.entry - livePrice) * p.volume * asset.contract * (asset.symbol === "USDJPY" ? .0068 : 1); return <tr key={p.id} className="border-t border-white/5"><td className="p-2 font-semibold">{asset.symbol}</td><td className={p.side === "BUY" ? "text-emerald-300" : "text-red-300"}>{p.side}</td><td>{p.volume.toFixed(2)}</td><td>{fmt(p.entry, asset.digits)}</td><td>{p.sl ? fmt(p.sl, asset.digits) : "—"}</td><td>{p.tp ? fmt(p.tp, asset.digits) : "—"}</td><td className={pp >= 0 ? "text-emerald-300" : "text-red-300"}>{pp >= 0 ? "+" : ""}{pp.toFixed(2)}</td><td><button onClick={() => closePosition(p.id)} className="rounded p-1 hover:bg-white/10"><X className="size-3" /></button></td></tr>; })}</tbody></table>}{bottom === "History" && <div className="space-y-1 p-3">{history.length ? history.map(h => <div key={h.id} className="flex justify-between text-[10px]"><span>{asset.symbol} {h.side} • {h.volume.toFixed(2)}</span><span className={h.pnl >= 0 ? "text-emerald-300" : "text-red-300"}>{h.pnl >= 0 ? "+" : ""}{h.pnl.toFixed(2)} USD</span></div>) : <span className="text-slate-500">Žádné uzavřené obchody.</span>}</div>}{bottom !== "Trade" && bottom !== "History" && <div className="p-3 text-[10px] text-slate-500">Panel {bottom}: připraven pro další modul Trading Academy.</div>}</div></div>
      </main>
    </div>
    {toast && <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-yellow-300/20 bg-[#1d2027] px-4 py-3 text-xs shadow-2xl">{toast}</div>}
  </div>;
}
