import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, ChevronLeft, ChevronRight, RotateCcw, ShieldCheck, Target, TrendingDown, TrendingUp } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/trading-lab")({
  head: () => ({
    meta: [
      { title: "Trading Lab — Trading Academy CZ" },
      { name: "description", content: "Praktický simulátor pro procvičení práce s grafem, příkazy, SL, TP a řízením pozice." },
    ],
  }),
  component: TradingLab,
});

type Candle = { o: number; h: number; l: number; c: number };
type Position = { id: number; side: "BUY" | "SELL"; volume: number; entry: number; sl: number; tp: number };

const assets = [
  { symbol: "EURUSD", name: "Euro / US Dollar", digits: 5, seed: 1.1042, pip: 0.0001 },
  { symbol: "XAUUSD", name: "Gold / US Dollar", digits: 2, seed: 3645.2, pip: 1 },
  { symbol: "BTCUSD", name: "Bitcoin / US Dollar", digits: 2, seed: 112450, pip: 1 },
];

function makeCandles(seed: number): Candle[] {
  const out: Candle[] = [];
  let p = seed;
  for (let i = 0; i < 36; i++) {
    const wave = Math.sin(i * 0.72) * seed * 0.0012 + Math.cos(i * 0.28) * seed * 0.0007;
    const body = seed * 0.0005 + Math.abs(Math.sin(i * 1.7)) * seed * 0.00035;
    const o = p;
    const c = p + wave;
    const h = Math.max(o, c) + body * 0.9;
    const l = Math.min(o, c) - body * 0.8;
    out.push({ o, h, l, c });
    p = c;
  }
  return out;
}

function money(v: number) { return `${v >= 0 ? "+" : ""}${v.toFixed(2)} USD`; }
function price(v: number, d: number) { return v.toLocaleString("cs-CZ", { minimumFractionDigits: d, maximumFractionDigits: d }); }

function TradingLab() {
  const [assetIndex, setAssetIndex] = useState(0);
  const asset = assets[assetIndex];
  const [candles, setCandles] = useState(() => makeCandles(asset.seed));
  const [visible, setVisible] = useState(20);
  const [balance, setBalance] = useState(10000);
  const [volume, setVolume] = useState(0.1);
  const [sl, setSl] = useState(25);
  const [tp, setTp] = useState(50);
  const [positions, setPositions] = useState<Position[]>([]);
  const [task, setTask] = useState(0);
  const [note, setNote] = useState("Začni výběrem instrumentu a otevři první demo pozici.");

  const last = candles[visible - 1] ?? candles[candles.length - 1];
  const currentPrice = last.c;
  const pnl = useMemo(() => positions.reduce((sum, p) => {
    const delta = p.side === "BUY" ? currentPrice - p.entry : p.entry - currentPrice;
    return sum + delta / asset.pip * p.volume * (asset.symbol === "EURUSD" ? 1 : 0.1);
  }, 0), [positions, currentPrice, asset]);
  const equity = balance + pnl;

  function selectAsset(i: number) {
    setAssetIndex(i); setCandles(makeCandles(assets[i].seed)); setVisible(20); setPositions([]); setBalance(10000); setTask(0); setNote("Nový trénink. Otevři první demo pozici.");
  }

  function open(side: "BUY" | "SELL") {
    const slPrice = side === "BUY" ? currentPrice - sl * asset.pip : currentPrice + sl * asset.pip;
    const tpPrice = side === "BUY" ? currentPrice + tp * asset.pip : currentPrice - tp * asset.pip;
    setPositions((p) => [...p, { id: Date.now(), side, volume, entry: currentPrice, sl: slPrice, tp: tpPrice }]);
    setTask((t) => Math.max(t, 1));
    setNote(`${side} otevřen. Nyní sleduj řízení rizika a pokračuj v replay.`);
  }

  function replay(n: number) {
    setVisible((v) => {
      const next = Math.min(candles.length, v + n);
      if (next >= 23) setTask((t) => Math.max(t, 3));
      setNote(next >= 23 ? "Replay splněn. Zavři pozici a vyhodnoť P/L." : `Trh posunut o ${n} svíčku.`);
      return next;
    });
  }

  function close(id: number) {
    const p = positions.find((x) => x.id === id);
    if (!p) return;
    const delta = p.side === "BUY" ? currentPrice - p.entry : p.entry - currentPrice;
    const result = delta / asset.pip * p.volume * (asset.symbol === "EURUSD" ? 1 : 0.1);
    setBalance((b) => b + result);
    setPositions((items) => items.filter((x) => x.id !== id));
    setTask((t) => Math.max(t, 4));
    setNote(`Pozice uzavřena. Výsledek ${money(result)}.`);
  }

  function reset() { selectAsset(assetIndex); }

  const chartW = 820, chartH = 340, pad = 28;
  const shown = candles.slice(0, visible);
  const hi = Math.max(...shown.map((c) => c.h)), lo = Math.min(...shown.map((c) => c.l));
  const range = Math.max(hi - lo, 0.000001);
  const step = (chartW - pad * 2) / shown.length;
  const y = (v: number) => chartH - pad - ((v - lo) / range) * (chartH - pad * 2);
  const tasks = ["Otevři BUY 0,10 lotu.", "Měj nastavený SL pod vstupem a TP nad vstupem.", "Posuň Market Replay o 3 svíčky.", "Zkontroluj průběžný P/L.", "Zavři pozici a vyhodnoť obchod."];

  return <SiteLayout><div className="mx-auto max-w-7xl px-4 py-10">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div>
      <Badge variant="secondary"><Target className="mr-1 size-3.5" /> Trading Lab</Badge>
      <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Nauč se pracovat s tradingovou platformou</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">Bezpečný demo terminál pro trénink grafu, BUY/SELL, lotů, stop-lossu, take-profitu a řízení pozice. Žádné reálné peníze.</p>
    </div><Button variant="ghost" onClick={reset}><RotateCcw className="size-4" /> Reset tréninku</Button></div>

    <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_330px]">
      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 p-4"><div className="flex flex-wrap gap-2">{assets.map((a, i) => <Button key={a.symbol} size="sm" variant={i === assetIndex ? "default" : "secondary"} onClick={() => selectAsset(i)}>{a.symbol}</Button>)}</div><div className="text-right"><div className="text-xs text-muted-foreground">{asset.name}</div><div className="font-display text-xl font-semibold">{price(currentPrice, asset.digits)}</div></div></div>
        <div className="overflow-x-auto bg-secondary/10 p-3"><svg viewBox={`0 0 ${chartW} ${chartH}`} className="min-w-[680px] w-full h-[340px]">
          {[0, .25, .5, .75, 1].map((t) => <line key={t} x1={pad} x2={chartW-pad} y1={pad+t*(chartH-pad*2)} y2={pad+t*(chartH-pad*2)} stroke="currentColor" opacity=".08" />)}
          {shown.map((c, i) => { const x=pad+i*step+step/2, up=c.c>=c.o, top=Math.min(y(c.o),y(c.c)), body=Math.max(2,Math.abs(y(c.c)-y(c.o))); return <g key={i} className={up ? "text-[var(--color-success)]" : "text-destructive"}><line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke="currentColor" strokeWidth="1.5"/><rect x={x-step*.25} y={top} width={Math.max(5,step*.5)} height={body} fill="currentColor" rx="1"/></g> })}
          <line x1={pad} x2={chartW-pad} y1={y(currentPrice)} y2={y(currentPrice)} stroke="currentColor" strokeDasharray="4 4" opacity=".45"/>
        </svg></div>
        <div className="grid grid-cols-2 gap-3 border-t border-border/70 p-4 md:grid-cols-4"><Stat label="Balance" value={`${balance.toFixed(2)} USD`} /><Stat label="Equity" value={`${equity.toFixed(2)} USD`} /><Stat label="P/L" value={money(pnl)} /><Stat label="Pozice" value={`${positions.length}`} /></div>
        <div className="border-t border-border/70 p-4"><div className="grid gap-3 md:grid-cols-3"><Field label="Loty" value={volume} step={.01} onChange={setVolume}/><Field label="SL (body)" value={sl} step={1} onChange={setSl}/><Field label="TP (body)" value={tp} step={1} onChange={setTp}/></div><div className="mt-4 grid grid-cols-2 gap-2"><Button onClick={() => open("BUY")}><TrendingUp className="size-4"/> BUY</Button><Button variant="secondary" onClick={() => open("SELL")}><TrendingDown className="size-4"/> SELL</Button></div></div>
      </section>

      <aside className="space-y-5"><div className="surface p-5"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-primary"/> Tréninkový úkol</div><div className="mt-3 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${task/5*100}%`}}/></div><p className="mt-4 text-sm leading-relaxed">{tasks[task] ?? "Trénink dokončen."}</p><p className="mt-3 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">{note}</p></div>
        <div className="surface p-5"><div className="flex items-center gap-2 font-semibold"><Activity className="size-4 text-primary"/> Market Replay</div><p className="mt-1 text-xs text-muted-foreground">Rozhoduj se jen podle svíček, které už trh ukázal.</p><div className="mt-4 flex gap-2"><Button size="sm" variant="secondary" onClick={() => setVisible(v => Math.max(10,v-1))}><ChevronLeft className="size-4"/></Button><Button className="flex-1" onClick={() => replay(1)}>Další svíčka</Button><Button size="sm" variant="secondary" onClick={() => replay(3)}><ChevronRight className="size-4"/></Button></div><div className="mt-3 text-center text-xs text-muted-foreground">{visible}/{candles.length} svíček</div></div></aside>
    </div>

    <section className="surface mt-6 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Otevřené pozice</h2><p className="text-sm text-muted-foreground">Stejný základní workflow jako v reálném trading terminálu.</p></div><Badge variant="outline">Demo účet</Badge></div>{positions.length===0 ? <p className="mt-6 text-sm text-muted-foreground">Žádná pozice. Otevři BUY nebo SELL.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-border/70 text-left text-xs text-muted-foreground"><th className="pb-3">Směr</th><th className="pb-3">Loty</th><th className="pb-3">Vstup</th><th className="pb-3">SL</th><th className="pb-3">TP</th><th className="pb-3">P/L</th><th className="pb-3 text-right">Akce</th></tr></thead><tbody>{positions.map(p => { const d=p.side==="BUY"?currentPrice-p.entry:p.entry-currentPrice; const val=d/asset.pip*p.volume*(asset.symbol==="EURUSD"?1:.1); return <tr key={p.id} className="border-b border-border/50"><td className="py-3 font-semibold">{p.side}</td><td>{p.volume.toFixed(2)}</td><td>{price(p.entry,asset.digits)}</td><td>{price(p.sl,asset.digits)}</td><td>{price(p.tp,asset.digits)}</td><td className={val>=0?"text-[var(--color-success)]":"text-destructive"}>{money(val)}</td><td className="py-3 text-right"><Button size="sm" variant="secondary" onClick={() => close(p.id)}>Zavřít</Button></td></tr>})}</tbody></table></div>}</section>
  </div></SiteLayout>;
}

function Stat({label,value}:{label:string;value:string}){return <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>}
function Field({label,value,step,onChange}:{label:string;value:number;step:number;onChange:(v:number)=>void}){return <label className="block text-[11px] uppercase tracking-wide text-muted-foreground">{label}<Input className="mt-1" type="number" min={step} step={step} value={value} onChange={e=>onChange(Math.max(step,Number(e.target.value)||step))}/></label>}
