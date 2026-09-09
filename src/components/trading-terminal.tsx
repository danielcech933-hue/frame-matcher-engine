import { useEffect, useMemo, useState } from "react";
import { BarChart3, Crosshair, Grid3X3, RotateCcw, Settings2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Side = "BUY" | "SELL";
type Pos = { id: number; side: Side; volume: number; entry: number; sl: number; tp: number };
type Candle = { o: number; h: number; l: number; c: number };
type Asset = { symbol: string; digits: number; point: number; price: number; volatility: number };

const ASSETS: Asset[] = [
  { symbol: "EURUSD", digits: 5, point: 0.00001, price: 1.17420, volatility: 0.00018 },
  { symbol: "GBPUSD", digits: 5, point: 0.00001, price: 1.35410, volatility: 0.00025 },
  { symbol: "USDJPY", digits: 3, point: 0.001, price: 147.420, volatility: 0.035 },
  { symbol: "XAUUSD", digits: 2, point: 0.01, price: 3645.20, volatility: 1.8 },
  { symbol: "BTCUSD", digits: 2, point: 0.01, price: 112450.00, volatility: 420 },
  { symbol: "AAPL", digits: 2, point: 0.01, price: 238.40, volatility: 0.8 },
  { symbol: "NVDA", digits: 2, point: 0.01, price: 176.90, volatility: 1.1 },
  { symbol: "SPY", digits: 2, point: 0.01, price: 653.80, volatility: 1.2 },
  { symbol: "QQQ", digits: 2, point: 0.01, price: 581.10, volatility: 1.35 },
];
const TFS = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];
const INDS = ["EMA 20", "SMA 20", "RSI 14", "MACD", "Bollinger Bands", "ATR 14"];

function buildCandles(asset: Asset): Candle[] {
  let p = asset.price;
  return Array.from({ length: 100 }, (_, i) => {
    const wave = Math.sin(i * 0.33) * asset.volatility * 1.4 + Math.cos(i * 0.12) * asset.volatility * 0.8;
    const o = p;
    const c = Math.max(asset.point, p + wave);
    const h = Math.max(o, c) + asset.volatility * 0.7;
    const l = Math.min(o, c) - asset.volatility * 0.7;
    p = c;
    return { o, h, l, c };
  });
}
function fmt(v: number, d: number) { return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
function calcPnl(p: Pos, current: number, asset: Asset) {
  const delta = p.side === "BUY" ? current - p.entry : p.entry - current;
  const contract = asset.symbol.includes("USD") || ["AAPL", "NVDA", "SPY", "QQQ"].includes(asset.symbol) ? 100 : 10;
  return delta * p.volume * contract;
}
function ema(values: number[], n: number) { const k = 2 / (n + 1); let e = values[0] ?? 0; return values.map((v, i) => (i === 0 ? e : (e = v * k + e * (1 - k)))); }
function sma(values: number[], n: number) { return values.map((v, i) => i < n - 1 ? null : values.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n); }
function rsi(values: number[], n = 14) { return values.map((_, i) => { if (i < n) return null; let up = 0, down = 0; for (let j = i - n + 1; j <= i; j++) { const d = values[j] - values[j - 1]; if (d > 0) up += d; else down -= d; } return down === 0 ? 100 : 100 - 100 / (1 + up / down); }); }

export function TradingTerminal() {
  const [assetIndex, setAssetIndex] = useState(0);
  const asset = ASSETS[assetIndex];
  const [candles, setCandles] = useState(() => buildCandles(asset));
  const [timeframe, setTimeframe] = useState("M15");
  const [balance, setBalance] = useState(10000);
  const [volume, setVolume] = useState(0.1);
  const [slPts, setSlPts] = useState(250);
  const [tpPts, setTpPts] = useState(500);
  const [positions, setPositions] = useState<Pos[]>([]);
  const [selectedInds, setSelectedInds] = useState<string[]>([]);
  const [bottom, setBottom] = useState("Trade");
  const [grid, setGrid] = useState(true);
  const [crosshair, setCrosshair] = useState(false);
  const [visible, setVisible] = useState(60);
  const [message, setMessage] = useState("Demo účet připraven.");

  useEffect(() => {
    const id = window.setInterval(() => {
      setCandles(prev => {
        const last = prev[prev.length - 1];
        const move = (Math.random() - 0.48) * asset.volatility;
        const c = Math.max(asset.point, last.c + move);
        const next = [...prev.slice(-99), { o: last.c, h: Math.max(last.c, c) + asset.volatility * 0.25, l: Math.min(last.c, c) - asset.volatility * 0.25, c }];
        return next;
      });
    }, 1200);
    return () => window.clearInterval(id);
  }, [asset]);

  const current = candles.at(-1)?.c ?? asset.price;
  const values = candles.map(c => c.c);
  const e20 = ema(values, 20);
  const s20 = sma(values, 20);
  const r14 = rsi(values).at(-1);
  const pnl = useMemo(() => positions.reduce((s, p) => s + calcPnl(p, current, asset), 0), [positions, current, asset]);
  const equity = balance + pnl;

  function selectAsset(index: number) { setAssetIndex(index); setCandles(buildCandles(ASSETS[index])); setPositions([]); setBalance(10000); setMessage(`${ASSETS[index].symbol} aktivní.`); }
  function toggleInd(ind: string) { setSelectedInds(v => v.includes(ind) ? v.filter(x => x !== ind) : [...v, ind]); }
  function open(side: Side) {
    const sl = side === "BUY" ? current - slPts * asset.point : current + slPts * asset.point;
    const tp = side === "BUY" ? current + tpPts * asset.point : current - tpPts * asset.point;
    setPositions(v => [...v, { id: Date.now(), side, volume, entry: current, sl, tp }]);
    setMessage(`${side} ${volume.toFixed(2)} lot na ${fmt(current, asset.digits)}.`);
  }
  function close(id: number) { const p = positions.find(x => x.id === id); if (!p) return; const result = calcPnl(p, current, asset); setBalance(b => b + result); setPositions(v => v.filter(x => x.id !== id)); setMessage(`Pozice uzavřena: ${result >= 0 ? "+" : ""}${result.toFixed(2)} USD.`); }
  function reset() { setBalance(10000); setPositions([]); setCandles(buildCandles(asset)); setMessage("Demo účet resetován."); }

  const shown = candles.slice(-visible);
  const W = 1100, H = 490, pad = 35;
  const hi = Math.max(...shown.map(c => c.h)), lo = Math.min(...shown.map(c => c.l)), range = Math.max(hi - lo, asset.point * 30);
  const sx = (W - 2 * pad) / shown.length;
  const yy = (v: number) => H - pad - ((v - lo) / range) * (H - 2 * pad);
  const xx = (i: number) => pad + sx * i + sx / 2;
  const es = e20.slice(-visible), ss = s20.slice(-visible);

  return <div className="overflow-hidden rounded-lg border border-white/10 bg-[#15171d] shadow-2xl">
    <div className="flex items-center justify-between border-b border-white/10 bg-[#20232a] px-3 py-2 text-xs"><span className="flex items-center gap-2"><BarChart3 className="size-4 text-yellow-300"/><b>Trading Academy — Demo Terminal</b></span><span className="text-emerald-300">● LIVE DEMO</span></div>
    <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#1b1e24] p-1 text-[10px]">{["Soubor","Zobrazit","Vložit","Grafy","Nástroje","Okno"].map(x => <button key={x} className="rounded px-2 py-1.5 hover:bg-white/10">{x}</button>)}<span className="mx-1 h-4 w-px bg-white/10"/><button className="rounded p-1.5 hover:bg-white/10" onClick={() => setCrosshair(v => !v)} title="Crosshair"><Crosshair className="size-3.5"/></button><button className="rounded p-1.5 hover:bg-white/10" onClick={() => setGrid(v => !v)} title="Grid"><Grid3X3 className="size-3.5"/></button><button className="rounded p-1.5 hover:bg-white/10" onClick={reset} title="Reset"><RotateCcw className="size-3.5"/></button></div>
    <div className="grid lg:grid-cols-[235px_1fr]">
      <aside className="hidden border-r border-white/10 bg-[#17191f] lg:block"><div className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500">Market Watch</div>{ASSETS.map((a,i)=><button key={a.symbol} onClick={() => selectAsset(i)} className={`grid w-full grid-cols-[1fr_auto] px-3 py-2 text-left text-xs hover:bg-white/5 ${i===assetIndex?"bg-yellow-400/10":""}`}><span className="font-semibold">{a.symbol}</span><span>{fmt(i===assetIndex?current:a.price,a.digits)}</span></button>)}<div className="border-y border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500">Navigator</div>{INDS.map(ind=><button key={ind} onClick={()=>toggleInd(ind)} className={`w-full px-3 py-2 text-left text-xs ${selectedInds.includes(ind)?"text-yellow-300":"text-slate-400"}`}>▸ {ind}</button>)}</aside>
      <main className="min-w-0">
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#1a1d23] p-1">{TFS.map(tf=><button key={tf} onClick={()=>setTimeframe(tf)} className={`rounded px-2 py-1 text-[10px] ${tf===timeframe?"bg-yellow-300 text-black font-semibold":"text-slate-500 hover:bg-white/10"}`}>{tf}</button>)}<span className="ml-auto px-2 text-[10px] text-slate-500">{asset.symbol} · {fmt(current,asset.digits)}</span></div>
        <div className="border-b border-white/10 bg-[#0d1015] p-2"><div className="mb-1 flex flex-wrap gap-1">{INDS.map(ind=><button key={ind} onClick={()=>toggleInd(ind)} className={`rounded border px-2 py-1 text-[10px] ${selectedInds.includes(ind)?"border-yellow-300/50 text-yellow-300":"border-white/10 text-slate-500"}`}>{ind}</button>)}{selectedInds.includes("RSI 14")&&<span className="ml-auto text-[10px] text-slate-500">RSI: {r14?.toFixed(1) ?? "—"}</span>}</div><div className="overflow-x-auto"><svg viewBox={`0 0 ${W} ${H}`} className="min-w-[760px] h-[490px] w-full">{grid&&[0,.2,.4,.6,.8,1].map(t=><line key={t} x1={pad} x2={W-pad} y1={pad+t*(H-2*pad)} y2={pad+t*(H-2*pad)} stroke="currentColor" opacity=".06"/>)}{shown.map((c,i)=>{const up=c.c>=c.o;return <g key={i} className={up?"text-emerald-400":"text-red-400"}><line x1={xx(i)} x2={xx(i)} y1={yy(c.h)} y2={yy(c.l)} stroke="currentColor"/><rect x={xx(i)-Math.max(2,sx*.28)} y={Math.min(yy(c.o),yy(c.c))} width={Math.max(3,sx*.56)} height={Math.max(2,Math.abs(yy(c.c)-yy(c.o)))} fill="currentColor"/></g>})}{selectedInds.includes("EMA 20")&&<polyline points={es.map((v,i)=>`${xx(i)},${yy(v)}`).join(" ")} fill="none" stroke="#facc15" strokeWidth="2"/>}{selectedInds.includes("SMA 20")&&<polyline points={ss.map((v,i)=>v==null?"":`${xx(i)},${yy(v)}`).filter(Boolean).join(" ")} fill="none" stroke="#60a5fa" strokeWidth="1.5"/>}<line x1={pad} x2={W-pad} y1={yy(current)} y2={yy(current)} stroke="#facc15" strokeDasharray="4 3"/>{crosshair&&<><line x1={W/2} x2={W/2} y1={pad} y2={H-pad} stroke="white" opacity=".2"/><line x1={pad} x2={W-pad} y1={H/2} y2={H/2} stroke="white" opacity=".2"/></>}</svg></div></div>
        <div className="grid grid-cols-2 border-b border-white/10 bg-[#171a20] sm:grid-cols-5">{[["Balance",`$${balance.toFixed(2)}`],["Equity",`$${equity.toFixed(2)}`],["Margin",`$${(positions.length*volume*100).toFixed(2)}`],["P/L",`${pnl>=0?"+":""}${pnl.toFixed(2)}`],["Positions",String(positions.length)]].map(([k,v])=><div key={k} className="border-r border-white/5 px-3 py-2"><div className="text-[9px] uppercase text-slate-500">{k}</div><div className={`mt-1 text-xs font-semibold ${k==="P/L"?(pnl>=0?"text-emerald-300":"text-red-300"):""}`}>{v}</div></div>)}</div>
        <div className="grid gap-2 border-b border-white/10 bg-[#1b1e24] p-2 md:grid-cols-[1fr_330px]"><div className="grid grid-cols-2 gap-2"><Button onClick={()=>open("SELL")} className="h-11 bg-red-500/10 text-red-300 hover:bg-red-500/20"><TrendingDown className="size-4"/> SELL <span className="ml-auto">{fmt(current-asset.point*2,asset.digits)}</span></Button><Button onClick={()=>open("BUY")} className="h-11 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"><TrendingUp className="size-4"/> BUY <span className="ml-auto">{fmt(current+asset.point*2,asset.digits)}</span></Button></div><div className="grid grid-cols-3 gap-2"><label className="text-[9px] text-slate-500">Volume<Input value={volume} min={0.01} step={0.01} type="number" onChange={e=>setVolume(Math.max(.01,Number(e.target.value)||.01))} className="mt-1 h-8 bg-black/20 text-xs"/></label><label className="text-[9px] text-slate-500">SL points<Input value={slPts} min={0} step={10} type="number" onChange={e=>setSlPts(Math.max(0,Number(e.target.value)||0))} className="mt-1 h-8 bg-black/20 text-xs"/></label><label className="text-[9px] text-slate-500">TP points<Input value={tpPts} min={0} step={10} type="number" onChange={e=>setTpPts(Math.max(0,Number(e.target.value)||0))} className="mt-1 h-8 bg-black/20 text-xs"/></label></div></div>
        <div><div className="flex overflow-x-auto border-b border-white/10 bg-[#15171c]">{["Trade","Exposure","History","News","Alerts","Journal"].map(t=><button key={t} onClick={()=>setBottom(t)} className={`px-4 py-2 text-[10px] ${bottom===t?"border-b-2 border-yellow-300 text-white":"text-slate-500"}`}>{t}</button>)}</div>{bottom==="Trade"?<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-[10px]"><thead className="bg-[#1c1f26] text-left text-slate-500"><tr><th className="p-2">Symbol</th><th>Type</th><th>Volume</th><th>Entry</th><th>S/L</th><th>T/P</th><th>Profit</th><th/></tr></thead><tbody>{positions.length===0?<tr><td colSpan={8} className="p-5 text-center text-slate-600">Žádné otevřené pozice</td></tr>:positions.map(p=><tr key={p.id} className="border-t border-white/5"><td className="p-2 font-semibold">{asset.symbol}</td><td className={p.side==="BUY"?"text-emerald-300":"text-red-300"}>{p.side}</td><td>{p.volume.toFixed(2)}</td><td>{fmt(p.entry,asset.digits)}</td><td>{fmt(p.sl,asset.digits)}</td><td>{fmt(p.tp,asset.digits)}</td><td className={calcPnl(p,current,asset)>=0?"text-emerald-300":"text-red-300"}>{pnlText(calcPnl(p,current,asset))}</td><td><Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={()=>close(p.id)}>Close</Button></td></tr>)}</tbody></table></div>:<div className="p-5 text-xs text-slate-500">{bottom === "News" ? "Market news může být napojeno na sekci Novinky & trh." : message}</div>}</div>
        <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-500"><span>{message}</span><span>Spread 4 pts · Demo only</span></div>
      </main>
    </div>
  </div></div>;
}