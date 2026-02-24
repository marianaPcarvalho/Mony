import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function YearlyPlanner() {
  const { data, addYearlyPlan, deleteYearlyPlan } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [month, setMonth] = useState("0");
  const [amount, setAmount] = useState("");

  const handleAdd = () => {
    if (!name || !amount) return;
    addYearlyPlan({ name, month: parseInt(month), amount: parseFloat(amount) });
    setOpen(false);
    setName("");
    setAmount("");
  };

  // Group by month
  const byMonth = MONTHS.map((mName, idx) => ({
    name: mName,
    idx,
    plans: data.yearlyPlans.filter(p => p.month === idx),
    total: data.yearlyPlans.filter(p => p.month === idx).reduce((s, p) => s + p.amount, 0),
  }));

  const yearTotal = data.yearlyPlans.reduce((s, p) => s + p.amount, 0);

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">Yearly Planner</h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Total planned: €{yearTotal.toLocaleString()}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-3.5 w-3.5" /> Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Planned Expense</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Car Insurance" />
              </div>
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (€)</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <Button onClick={handleAdd} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Add Plan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {byMonth.map(m => (
          <div key={m.idx} className={`p-3 rounded-xl text-center space-y-1 transition-colors ${m.total > 0 ? "bg-accent/10 border border-accent/20" : "bg-muted/30"}`}>
            <p className="text-xs font-semibold text-muted-foreground">{m.name}</p>
            <p className="font-mono text-sm font-bold">{m.total > 0 ? `€${m.total.toLocaleString()}` : "—"}</p>
          </div>
        ))}
      </div>

      {data.yearlyPlans.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">All planned expenses</p>
          {data.yearlyPlans
            .sort((a, b) => a.month - b.month)
            .map(plan => (
              <div key={plan.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-8">{MONTHS[plan.month]}</span>
                  <span className="text-sm">{plan.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">€{plan.amount.toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteYearlyPlan(plan.id)}>
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
