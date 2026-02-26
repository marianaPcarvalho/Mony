import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function YearlyPlanner() {
  const { data, addYearlyPlan, updateYearlyPlan, deleteYearlyPlan, getPlannedMonthlySavings } = useStore();
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

  const plannedSavings = getPlannedMonthlySavings();

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
          <h3 className="section-title">Yearly Planner</h3>
          <div className="flex gap-4 mt-1">
            <p className="text-xs text-muted-foreground font-mono">
              Budgeted expenses: <span className="font-semibold text-foreground">€{yearTotal.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
            </p>
            {plannedSavings > 0 && (
              <p className="text-xs text-muted-foreground font-mono">
                Planned savings: <span className="font-semibold text-[hsl(var(--savings))]">€{(plannedSavings * 12).toLocaleString("en", { minimumFractionDigits: 2 })}</span>/yr
              </p>
            )}
          </div>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs" aria-label="Add budgeted expense">
              <Plus className="h-3.5 w-3.5" /> Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Budgeted Expense</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="plan-desc">Description</Label>
                <Input id="plan-desc" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., Car Insurance" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-month">Month</Label>
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
                <Label htmlFor="plan-amount">Amount (€)</Label>
                <Input id="plan-amount" type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" />
              </div>
              <Button onClick={handleSave} className="w-full">{editId ? "Update" : "Add"} Plan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month grid with events visible */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {byMonth.map(m => {
          const isSelected = filterMonth === String(m.idx);
          return (
            <button
              key={m.idx}
              onClick={() => setFilterMonth(isSelected ? "all" : String(m.idx))}
              className={`p-3 rounded-xl text-left space-y-1 transition-all border ${
                isSelected
                  ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                  : m.plans.length > 0
                    ? "bg-accent/8 border-accent/15 hover:border-accent/30"
                    : "bg-muted/30 border-transparent hover:bg-muted/50"
              }`}
            >
              <p className="text-xs font-semibold text-muted-foreground">{m.name}</p>
              <p className="font-mono text-sm font-bold text-foreground">{m.total > 0 ? `€${m.total.toLocaleString()}` : "—"}</p>
              {m.plans.length > 0 && (
                <div className="space-y-0.5">
                  {m.plans.slice(0, 2).map(p => (
                    <p key={p.id} className="text-[10px] text-muted-foreground truncate">{p.name}</p>
                  ))}
                  {m.plans.length > 2 && (
                    <p className="text-[10px] text-muted-foreground">+{m.plans.length - 2} more</p>
                  )}
                </div>
              )}
              {plannedSavings > 0 && (
                <p className="font-mono text-[10px] text-[hsl(var(--savings))]">+€{plannedSavings.toFixed(0)} savings</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected month detail or all plans */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {selectedMonthData ? `${selectedMonthData.fullName} — ${selectedMonthData.plans.length} budgeted expenses` : "All budgeted expenses"}
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
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(plan)} aria-label="Edit plan">
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteYearlyPlan(plan.id)} aria-label="Delete plan">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {selectedMonthData ? `No budgeted expenses for ${selectedMonthData.fullName}.` : "No budgeted expenses yet."}
          </p>
        )}
      </div>
    </Card>
  );
}
