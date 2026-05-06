import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Trash2, Pencil, TrendingUp, TrendingDown, Wallet, Coins,
  Briefcase, ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { EmojiPickerButton } from "./EmojiPickerButton";
import type { Investment, InvestmentTransaction } from "@/lib/types";

const fmt = (v: number) =>
  `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (v: number) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

const TYPE_LABELS: Record<Investment["type"], string> = {
  stock: "Stock",
  etf: "ETF",
  crypto: "Crypto",
  fund: "Fund",
  bond: "Bond",
  other: "Other",
};

export function InvestmentsTracker() {
  const {
    data, addInvestment, updateInvestment, deleteInvestment,
    addInvestmentTransaction, deleteInvestmentTransaction,
  } = useStore();

  const investments = data.investments ?? [];

  // Form state
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<Investment["type"]>("stock");
  const [icon, setIcon] = useState("📈");
  const [units, setUnits] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Transaction form
  const [txInvestmentId, setTxInvestmentId] = useState<string | null>(null);
  const [txType, setTxType] = useState<InvestmentTransaction["type"]>("buy");
  const [txUnits, setTxUnits] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txNote, setTxNote] = useState("");

  const resetForm = () => {
    setEditId(null);
    setName(""); setSymbol(""); setType("stock"); setIcon("📈");
    setUnits(""); setAvgCost(""); setCurrentPrice("");
  };

  const isValid =
    name.trim().length > 0 &&
    !isNaN(parseFloat(units)) && parseFloat(units) >= 0 &&
    !isNaN(parseFloat(avgCost)) && parseFloat(avgCost) >= 0 &&
    !isNaN(parseFloat(currentPrice)) && parseFloat(currentPrice) >= 0;

  const handleSave = () => {
    if (!isValid) return;
    const payload = {
      name: name.trim(),
      symbol: symbol.trim() || undefined,
      type,
      icon,
      units: parseFloat(units),
      avgCost: parseFloat(avgCost),
      currentPrice: parseFloat(currentPrice),
      transactions: [] as InvestmentTransaction[],
    };
    if (editId) {
      const existing = investments.find(i => i.id === editId);
      if (existing) updateInvestment({ ...existing, ...payload, transactions: existing.transactions });
    } else {
      addInvestment(payload);
    }
    setOpen(false);
    resetForm();
  };

  const handleEdit = (inv: Investment) => {
    setEditId(inv.id);
    setName(inv.name);
    setSymbol(inv.symbol ?? "");
    setType(inv.type);
    setIcon(inv.icon);
    setUnits(String(inv.units));
    setAvgCost(String(inv.avgCost));
    setCurrentPrice(String(inv.currentPrice));
    setOpen(true);
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSave(); };

  const txValid =
    !isNaN(parseFloat(txUnits)) && parseFloat(txUnits) > 0 &&
    !isNaN(parseFloat(txPrice)) && parseFloat(txPrice) >= 0;

  const submitTx = () => {
    if (!txInvestmentId || !txValid) return;
    const u = parseFloat(txUnits);
    const p = parseFloat(txPrice);
    addInvestmentTransaction(txInvestmentId, {
      type: txType,
      date: new Date(txDate).toISOString(),
      units: u,
      pricePerUnit: p,
      amount: u * p,
      note: txNote || undefined,
    });
    setTxUnits(""); setTxPrice(""); setTxNote("");
    setTxInvestmentId(null);
  };

  // Portfolio aggregates
  const totals = useMemo(() => {
    let invested = 0, market = 0, dividends = 0;
    for (const inv of investments) {
      invested += inv.units * inv.avgCost;
      market += inv.units * inv.currentPrice;
      for (const t of inv.transactions ?? []) {
        if (t.type === "dividend") dividends += t.amount;
      }
    }
    const gain = market - invested;
    const gainPct = invested > 0 ? (gain / invested) * 100 : 0;
    return { invested, market, dividends, gain, gainPct };
  }, [investments]);

  const stats = [
    { label: "Portfolio value", value: fmt(totals.market), icon: Wallet, tone: "neutral" as const },
    { label: "Total invested", value: fmt(totals.invested), icon: Briefcase, tone: "neutral" as const },
    {
      label: "Total return",
      value: `${fmt(totals.gain)} (${fmtPct(totals.gainPct)})`,
      icon: totals.gain >= 0 ? TrendingUp : TrendingDown,
      tone: totals.gain >= 0 ? "success" as const : "destructive" as const,
    },
    { label: "Dividends earned", value: fmt(totals.dividends), icon: Coins, tone: "success" as const },
  ];

  const pendingDelete = deleteId ? investments.find(i => i.id === deleteId) : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="glass-card p-6">
        <div className="flex items-baseline justify-between gap-3 mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Investments
            <span className="text-muted-foreground font-medium ml-2 text-base">
              {investments.length} {investments.length === 1 ? "asset" : "assets"}
            </span>
          </h2>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-10" aria-label="New investment">
                <Plus className="h-4 w-4" /> New Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Investment</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5">
                    <Label>Icon</Label>
                    <EmojiPickerButton value={icon} onChange={setIcon} size="lg" ariaLabel="Pick icon" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="inv-name">Name <span className="text-destructive">*</span></Label>
                    <Input id="inv-name" value={name} onChange={e => setName(e.target.value)} onKeyDown={onKey} placeholder="e.g., Apple Inc." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-symbol">Symbol / Ticker</Label>
                    <Input id="inv-symbol" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} onKeyDown={onKey} placeholder="AAPL" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={(v) => setType(v as Investment["type"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-units">Units</Label>
                    <Input id="inv-units" type="number" min="0" step="any" inputMode="decimal" value={units}
                      onChange={e => setUnits(e.target.value)} onKeyDown={onKey} placeholder="0" className="font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-avg">Avg cost</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                      <Input id="inv-avg" type="number" min="0" step="0.01" inputMode="decimal" value={avgCost}
                        onChange={e => setAvgCost(e.target.value)} onKeyDown={onKey} placeholder="0.00" className="pl-7 font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-price">Current price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                      <Input id="inv-price" type="number" min="0" step="0.01" inputMode="decimal" value={currentPrice}
                        onChange={e => setCurrentPrice(e.target.value)} onKeyDown={onKey} placeholder="0.00" className="pl-7 font-mono" />
                    </div>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={!isValid} className="w-full">
                  {editId ? "Update" : "Add"} Investment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="flex flex-col gap-2 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  s.tone === "success" ? "bg-success/15 text-success" :
                  s.tone === "destructive" ? "bg-destructive/15 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</span>
              </div>
              <span className={`font-mono font-bold text-base ${
                s.tone === "success" ? "text-success" :
                s.tone === "destructive" ? "text-destructive" : "text-foreground"
              }`}>{s.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Holdings list */}
      <Card className="glass-card p-5 space-y-3">
        <h3 className="section-title flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" /> Holdings
        </h3>

        {investments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">
            No investments yet. Click <strong>New Asset</strong> to start tracking your portfolio.
          </p>
        )}

        <div className="space-y-3">
          {investments.map(inv => {
            const value = inv.units * inv.currentPrice;
            const cost = inv.units * inv.avgCost;
            const gain = value - cost;
            const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
            const isUp = gain >= 0;
            const isExpanded = expandedId === inv.id;
            const isAddTxOpen = txInvestmentId === inv.id;
            const portfolioPct = totals.market > 0 ? (value / totals.market) * 100 : 0;

            return (
              <div key={inv.id} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                      className="flex items-center gap-3 min-w-0 text-left flex-1"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      <span className="text-2xl flex-shrink-0" aria-hidden="true">{inv.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground truncate">{inv.name}</p>
                          {inv.symbol && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-muted text-muted-foreground">
                              {inv.symbol}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/70 text-muted-foreground">
                            {TYPE_LABELS[inv.type]}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {inv.units.toLocaleString("en", { maximumFractionDigits: 6 })} × {fmt(inv.currentPrice)}
                          <span className="text-muted-foreground/70"> · avg {fmt(inv.avgCost)}</span>
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-bold text-sm text-foreground">{fmt(value)}</p>
                        <p className={`text-xs font-mono font-semibold flex items-center justify-end gap-0.5 ${isUp ? "text-success" : "text-destructive"}`}>
                          {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {fmtPct(gainPct)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(inv)} aria-label={`Edit ${inv.name}`}>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(inv.id)} aria-label={`Delete ${inv.name}`}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Allocation bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Portfolio allocation</span>
                      <span className="font-mono">{portfolioPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${portfolioPct}%` }} />
                    </div>
                  </div>

                  {/* Expanded: transactions */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-border/60 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transactions</h4>
                        {!isAddTxOpen && (
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
                            onClick={() => { setTxInvestmentId(inv.id); setTxType("buy"); }}>
                            <Plus className="h-3 w-3" /> Add transaction
                          </Button>
                        )}
                      </div>

                      {isAddTxOpen && (
                        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            <Select value={txType} onValueChange={(v) => setTxType(v as InvestmentTransaction["type"])}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="buy">Buy</SelectItem>
                                <SelectItem value="sell">Sell</SelectItem>
                                <SelectItem value="dividend">Dividend</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="h-9" />
                            <Input type="number" min="0" step="any" inputMode="decimal" value={txUnits}
                              onChange={e => setTxUnits(e.target.value)} placeholder="Units" className="h-9 font-mono" />
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">€</span>
                              <Input type="number" min="0" step="0.01" inputMode="decimal" value={txPrice}
                                onChange={e => setTxPrice(e.target.value)} placeholder="Price" className="h-9 pl-6 font-mono" />
                            </div>
                            <Input value={txNote} onChange={e => setTxNote(e.target.value)} placeholder="Note (optional)" className="h-9" />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => { setTxInvestmentId(null); setTxUnits(""); setTxPrice(""); setTxNote(""); }}>
                              Cancel
                            </Button>
                            <Button size="sm" disabled={!txValid} onClick={submitTx}>Save</Button>
                          </div>
                        </div>
                      )}

                      {(inv.transactions?.length ?? 0) === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">No transactions logged yet.</p>
                      ) : (
                        <ul className="space-y-1">
                          {[...(inv.transactions ?? [])].sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                            <li key={t.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  t.type === "buy" ? "bg-success/15 text-success" :
                                  t.type === "sell" ? "bg-destructive/15 text-destructive" :
                                  "bg-primary/15 text-primary"
                                }`}>{t.type}</span>
                                <span className="text-muted-foreground">{new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}</span>
                                {t.units !== undefined && t.pricePerUnit !== undefined && (
                                  <span className="font-mono text-muted-foreground truncate">
                                    {t.units} × {fmt(t.pricePerUnit)}
                                  </span>
                                )}
                                {t.note && <span className="text-muted-foreground truncate">· {t.note}</span>}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="font-mono font-semibold text-foreground">{fmt(t.amount)}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6"
                                  onClick={() => deleteInvestmentTransaction(inv.id, t.id)}
                                  aria-label="Delete transaction">
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete investment?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `"${pendingDelete.name}" and all its transactions will be removed.` : ""} This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteInvestment(deleteId); setDeleteId(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
