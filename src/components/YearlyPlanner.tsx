import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil } from "lucide-react";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTH_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function YearlyPlanner() {
  const { data, addYearlyPlan, updateYearlyPlan, deleteYearlyPlan } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [month, setMonth] = useState("0");
  const [amount, setAmount] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const resetForm = () => { setName(""); setMonth("0"); setAmount(""); setEditId(null); };

  const handleSave = () => {
    if (!name || !amount) return;
    const planData = { name, month: parseInt(month), amount: parseFloat(amount) };
    if (editId) {
      updateYearlyPlan({ ...planData, id: editId });
    } else {
      addYearlyPlan(planData);
    }
    setOpen(false);
    resetForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  const handleEdit = (plan: typeof data.yearlyPlans[0]) => {
    setEditId(plan.id);
    setName(plan.name);
    setMonth(String(plan.month));
    setAmount(String(plan.amount));
    setOpen(true);
  };

  const openAddForMonth = (monthIdx: number) => {
    resetForm();
    setMonth(String(monthIdx));
    setOpen(true);
  };

  const byMonth = MONTHS.map((mName, idx) => ({
    name: mName,
    fullName: MONTH_FULL[idx],
    idx,
    plans: data.yearlyPlans.filter(p => p.month === idx),
    total: data.yearlyPlans.filter(p => p.month === idx).reduce((s, p) => s + p.amount, 0),
  }));

  const yearTotal = data.yearlyPlans.reduce((s, p) => s + p.amount, 0);

  const filteredPlans = filterMonth === "all"
    ? data.yearlyPlans.sort((a, b) => a.month - b.month)
    : data.yearlyPlans.filter(p => p.month === parseInt(filterMonth)).sort((a, b) => a.name.localeCompare(b.name));

  const selectedMonthData = filterMonth !== "all" ? byMonth[parseInt(filterMonth)] : null;

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">Planeador Anual</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Despesas planeadas: <span className="font-semibold text-foreground">€{yearTotal.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
      </div>

      {/* Month grid with +Plan inside each card */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {byMonth.map(m => {
          const isSelected = filterMonth === String(m.idx);
          return (
            <div
              key={m.idx}
              className={`p-3 rounded-xl text-left space-y-1 transition-all border ${
                isSelected
                  ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                  : m.plans.length > 0
                    ? "bg-accent/8 border-accent/15 hover:border-accent/30"
                    : "bg-muted/30 border-transparent hover:bg-muted/50"
              }`}
            >
              <button
                className="w-full text-left"
                onClick={() => setFilterMonth(isSelected ? "all" : String(m.idx))}
              >
                <p className="text-xs font-semibold text-muted-foreground">{m.name}</p>
                <p className="font-mono text-sm font-bold text-foreground">{m.total > 0 ? `€${m.total.toLocaleString()}` : "—"}</p>
                {m.plans.length > 0 && (
                  <div className="space-y-0.5">
                    {m.plans.slice(0, 2).map(p => (
                      <p key={p.id} className="text-[10px] text-muted-foreground truncate">{p.name}</p>
                    ))}
                    {m.plans.length > 2 && (
                      <p className="text-[10px] text-muted-foreground">+{m.plans.length - 2} mais</p>
                    )}
                  </div>
                )}
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-6 text-[10px] gap-1 mt-1 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); openAddForMonth(m.idx); }}
              >
                <Plus className="h-3 w-3" /> Plan
              </Button>
            </div>
          );
        })}
      </div>

      {/* Plan list */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {selectedMonthData ? `${selectedMonthData.fullName} — ${selectedMonthData.plans.length} despesas planeadas` : "Todas as despesas planeadas"}
          </p>
          {selectedMonthData && (
            <p className="text-xs font-mono font-semibold text-foreground">
              Total: €{selectedMonthData.total.toLocaleString("en", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
        {filteredPlans.length > 0 ? (
          filteredPlans.map(plan => (
            <div key={plan.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-8">{MONTHS[plan.month]}</span>
                <span className="text-sm text-foreground font-medium">{plan.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-semibold text-foreground">€{plan.amount.toFixed(2)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(plan)} aria-label="Editar plano">
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteYearlyPlan(plan.id)} aria-label="Eliminar plano">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {selectedMonthData ? `Sem despesas planeadas para ${selectedMonthData.fullName}.` : "Sem despesas planeadas. Clica em +Planear num mês para começar!"}
          </p>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Adicionar"} Despesa Planeada</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="plan-desc">Descrição</Label>
              <Input id="plan-desc" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="ex.: Seguro do carro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-month">Mês</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="plan-month"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-amount">Valor (€)</Label>
              <Input id="plan-amount" type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" />
            </div>
            <Button onClick={handleSave} className="w-full">{editId ? "Atualizar" : "Adicionar"} Plano</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
