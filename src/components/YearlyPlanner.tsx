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

export function YearlyPlanner() {
  const { data, addYearlyPlan, updateYearlyPlan, deleteYearlyPlan, getTotalSavingsMonthly } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [month, setMonth] = useState("0");
  const [amount, setAmount] = useState("");

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

  const handleEdit = (plan: typeof data.yearlyPlans[0]) => {
    setEditId(plan.id);
    setName(plan.name);
    setMonth(String(plan.month));
    setAmount(String(plan.amount));
    setOpen(true);
  };

  const monthlySavings = getTotalSavingsMonthly();

  // Group by month
  const byMonth = MONTHS.map((mName, idx) => ({
    name: mName,
    idx,
    plans: data.yearlyPlans.filter(p => p.month === idx),
    total: data.yearlyPlans.filter(p => p.month === idx).reduce((s, p) => s + p.amount, 0),
  }));

  const yearTotal = data.yearlyPlans.reduce((s, p) => s + p.amount, 0);
  const yearTotalWithSavings = yearTotal + monthlySavings * 12;

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">Yearly Planner</h3>
          <div className="flex gap-4 mt-1">
            <p className="text-xs text-muted-foreground font-mono">
              Planned expenses: <span className="font-semibold">€{yearTotal.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
            </p>
            {monthlySavings > 0 && (
              <p className="text-xs text-muted-foreground font-mono">
                + Savings: <span className="font-semibold text-accent">€{(monthlySavings * 12).toLocaleString("en", { minimumFractionDigits: 2 })}</span>/yr
              </p>
            )}
          </div>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs" aria-label="Add planned expense">
              <Plus className="h-3.5 w-3.5" /> Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Planned Expense</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="plan-desc">Description</Label>
                <Input id="plan-desc" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Car Insurance" />
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
                <Input id="plan-amount" type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <Button onClick={handleSave} className="w-full">{editId ? "Update" : "Add"} Plan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {byMonth.map(m => {
          const totalWithSavings = m.total + monthlySavings;
          return (
            <div key={m.idx} className={`p-3 rounded-xl text-center space-y-1 transition-colors ${m.total > 0 || monthlySavings > 0 ? "bg-accent/8 border border-accent/15" : "bg-muted/30 border border-transparent"}`}>
              <p className="text-xs font-semibold text-muted-foreground">{m.name}</p>
              <p className="font-mono text-sm font-bold text-foreground">{m.total > 0 ? `€${m.total.toLocaleString()}` : "—"}</p>
              {monthlySavings > 0 && (
                <p className="font-mono text-[10px] text-accent">+€{monthlySavings.toFixed(0)}</p>
              )}
            </div>
          );
        })}
      </div>

      {data.yearlyPlans.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">All planned expenses</p>
          {data.yearlyPlans
            .sort((a, b) => a.month - b.month)
            .map(plan => (
              <div key={plan.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-8">{MONTHS[plan.month]}</span>
                  <span className="text-sm">{plan.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-semibold">€{plan.amount.toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(plan)} aria-label="Edit plan">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteYearlyPlan(plan.id)} aria-label="Delete plan">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}
