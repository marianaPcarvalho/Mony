import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { EmojiPickerButton } from "./EmojiPickerButton";
import type { Investment } from "@/lib/types";

const fmt = (v: number) =>
  `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TYPE_LABELS: Record<Investment["type"], string> = {
  stock: "Ações & ETFs",
  etf: "Ações & ETFs",
  crypto: "Cripto",
  fund: "Obrigações / Fundos",
  bond: "Obrigações / Fundos",
  other: "Outros",
};

const TYPE_COLORS: Record<string, string> = {
  "Ações & ETFs": "hsl(220, 55%, 50%)",
  Crypto: "hsl(38, 92%, 45%)",
  "Obrigações / Fundos": "hsl(270, 50%, 48%)",
  Other: "hsl(168, 55%, 32%)",
};

export function Investments() {
  const { data, addInvestment, updateInvestment, deleteInvestment } = useStore();
  const investments = data.investments ?? [];

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<Investment["type"]>("stock");
  const [icon, setIcon] = useState("📈");
  const [units, setUnits] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");

  const resetForm = () => {
    setEditingId(null);
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
      transactions: [] as Investment["transactions"],
    };
    if (editingId) {
      const existing = investments.find(i => i.id === editingId);
      if (existing) {
        updateInvestment({ ...existing, ...payload, transactions: existing.transactions });
      }
    } else {
      addInvestment(payload);
    }
    setOpen(false);
    resetForm();
  };

  const handleEdit = (inv: Investment) => {
    setEditingId(inv.id);
    setName(inv.name);
    setSymbol(inv.symbol ?? "");
    setType(inv.type);
    setIcon(inv.icon);
    setUnits(String(inv.units));
    setAvgCost(String(inv.avgCost));
    setCurrentPrice(String(inv.currentPrice));
    setOpen(true);
  };

  // Aggregates
  const { totalInvested, totalCurrent, totalGain, totalGainPct } = useMemo(() => {
    const investido = investments.reduce((s, i) => s + i.units * i.avgCost, 0);
    const current = investments.reduce((s, i) => s + i.units * i.currentPrice, 0);
    const gain = current - investido;
    const gainPct = investido > 0 ? (gain / investido) * 100 : 0;
    return { totalInvested: investido, totalCurrent: current, totalGain: gain, totalGainPct: gainPct };
  }, [investments]);

  // Pie chart data — group by simplified type
  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of investments) {
      const label = TYPE_LABELS[inv.type];
      map.set(label, (map.get(label) ?? 0) + inv.units * inv.currentPrice);
    }
    return Array.from(map.entries())
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value, color: TYPE_COLORS[name] ?? "hsl(210, 20%, 50%)" }));
  }, [investments]);

  const pendingDelete = deleteId ? investments.find(i => i.id === deleteId) : null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="glass-card p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Investido</span>
          <span className="font-mono font-bold text-lg text-foreground">{fmt(totalInvested)}</span>
        </Card>
        <Card className="glass-card p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Valor Atual</span>
          <span className="font-mono font-bold text-lg text-foreground">{fmt(totalCurrent)}</span>
        </Card>
        <Card className="glass-card p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Ganho / Perda Total</span>
          <span className={`font-mono font-bold text-lg ${totalGain >= 0 ? "text-success" : "text-destructive"}`}>
            {totalGain >= 0 ? "+" : ""}{fmt(totalGain)}
          </span>
        </Card>
        <Card className="glass-card p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Retorno</span>
          <span className={`font-mono font-bold text-lg ${totalGainPct >= 0 ? "text-success" : "text-destructive"}`}>
            {totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(2)}%
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Pie chart */}
        <Card className="glass-card p-5 lg:col-span-1">
          <h3 className="section-title mb-4">Distribuição da Carteira</h3>
          {pieData.length > 0 ? (
            <>
              <div
                className="h-56"
                role="img"
                aria-label={`Distribuição da carteira em ${pieData.length} posições, total ${fmt(pieData.reduce((s, p) => s + p.value, 0))}.`}
              >
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={3}
                      isAnimationActive={false}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => fmt(value)}
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-mono font-medium ml-auto">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No investments yet</p>
          )}
        </Card>

        {/* Investments list */}
        <Card className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="section-title flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              My Investments
            </h3>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 h-9" aria-label="Adicionar investimento">
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar" : "Adicionar"} Investimento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="flex items-end gap-3">
                    <div className="space-y-1.5">
                      <Label>Ícone</Label>
                      <EmojiPickerButton value={icon} onChange={setIcon} size="lg" ariaLabel="Escolher ícone" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="inv-name">Nome <span className="text-destructive">*</span></Label>
                      <Input id="inv-name" value={name} onChange={e => setName(e.target.value)} placeholder="ex.: S&P 500 ETF, Bitcoin" autoFocus />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="inv-symbol">Símbolo / Ticker</Label>
                      <Input id="inv-symbol" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tipo</Label>
                      <Select value={type} onValueChange={(v) => setType(v as Investment["type"])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stock">Ação</SelectItem>
                          <SelectItem value="etf">ETF</SelectItem>
                          <SelectItem value="crypto">Cripto</SelectItem>
                          <SelectItem value="fund">Fundo</SelectItem>
                          <SelectItem value="bond">Obrigação</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="inv-units">Unidades</Label>
                      <Input id="inv-units" type="number" min="0" step="any" inputMode="decimal" value={units}
                        onChange={e => setUnits(e.target.value)} placeholder="0" className="font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="inv-avg">Custo Médio</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                        <Input id="inv-avg" type="number" min="0" step="0.01" inputMode="decimal" value={avgCost}
                          onChange={e => setAvgCost(e.target.value)} placeholder="0.00" className="pl-7 font-mono" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="inv-price">Preço Atual</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                        <Input id="inv-price" type="number" min="0" step="0.01" inputMode="decimal" value={currentPrice}
                          onChange={e => setCurrentPrice(e.target.value)} placeholder="0.00" className="pl-7 font-mono" />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={!isValid} className="w-full">
                    {editingId ? "Atualizar" : "Adicionar"} Investimento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {investments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">
                No investments yet. Add your first one!
              </p>
            )}
            {investments.map(inv => {
              const value = inv.units * inv.currentPrice;
              const cost = inv.units * inv.avgCost;
              const gain = value - cost;
              const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
              const isUp = gain >= 0;
              const typeLabel = TYPE_LABELS[inv.type];

              return (
                <div key={inv.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border/60 bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
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
                          {typeLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {fmt(cost)} investido
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-foreground">{fmt(value)}</p>
                      <p className={`text-xs font-mono font-semibold flex items-center justify-end gap-1 ${isUp ? "text-success" : "text-destructive"}`}>
                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isUp ? "+" : ""}{gainPct.toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(inv)} aria-label={`Edit ${inv.name}`}>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(inv.id)} aria-label={`Delete ${inv.name}`}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Investimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres eliminar <strong>{pendingDelete?.name}</strong>? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) deleteInvestment(deleteId); setDeleteId(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
