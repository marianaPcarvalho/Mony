import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, History, ChevronDown, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ICONS = ["🏠", "🚗", "✈️", "🎓", "💍", "🏖️", "📱", "💰", "🎯"];

export function SavingsGoals() {
  const { data, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addFundsToGoal } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏠");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [monthlyContrib, setMonthlyContrib] = useState("");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [addFundAmt, setAddFundAmt] = useState("");
  const [addFundNote, setAddFundNote] = useState("");
  const [fundDialogGoalId, setFundDialogGoalId] = useState<string | null>(null);

  const resetForm = () => { setName(""); setIcon("🏠"); setTarget(""); setCurrent(""); setTargetDate(""); setMonthlyContrib(""); setEditId(null); };

  const handleSave = () => {
    if (!name || !target) return;
    const goalData = {
      name,
      icon,
      targetAmount: parseFloat(target),
      currentAmount: parseFloat(current || "0"),
      color: "hsl(var(--accent))",
      targetDate: targetDate || undefined,
      monthlyContribution: parseFloat(monthlyContrib) || undefined,
      fundHistory: [] as any[],
    };
    if (editId) {
      const existing = data.savingsGoals.find(g => g.id === editId);
      if (existing) updateSavingsGoal({ ...existing, ...goalData, fundHistory: existing.fundHistory });
    } else {
      addSavingsGoal(goalData);
    }
    setOpen(false);
    resetForm();
  };

  const handleEdit = (goal: typeof data.savingsGoals[0]) => {
    setEditId(goal.id);
    setName(goal.name);
    setIcon(goal.icon);
    setTarget(String(goal.targetAmount));
    setCurrent(String(goal.currentAmount));
    setTargetDate(goal.targetDate ?? "");
    setMonthlyContrib(String(goal.monthlyContribution ?? ""));
    setOpen(true);
  };

  const handleAddFunds = () => {
    if (!fundDialogGoalId || !addFundAmt) return;
    addFundsToGoal(fundDialogGoalId, parseFloat(addFundAmt), addFundNote || undefined);
    setFundDialogGoalId(null);
    setAddFundAmt("");
    setAddFundNote("");
  };

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const totalMonthlySavings = data.savingsGoals.reduce((s, g) => s + (g.monthlyContribution ?? 0), 0);
  const totalSaved = data.savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = data.savingsGoals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">Savings Goals</h3>
          <div className="flex gap-4 mt-1">
            <p className="text-xs text-muted-foreground font-mono">
              Total saved: <span className="font-semibold text-accent">€{totalSaved.toLocaleString("en", { minimumFractionDigits: 2 })}</span> / €{totalTarget.toLocaleString("en", { minimumFractionDigits: 2 })}
            </p>
            {totalMonthlySavings > 0 && (
              <p className="text-xs text-muted-foreground font-mono">
                Monthly: <span className="font-semibold">€{totalMonthlySavings.toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs" aria-label="New savings goal">
              <Plus className="h-3.5 w-3.5" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Savings Goal</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {ICONS.map(i => (
                    <button key={i} onClick={() => setIcon(i)} role="radio" aria-checked={icon === i}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${icon === i ? "bg-accent/15 ring-2 ring-accent" : "bg-muted hover:bg-muted/80"}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-name">Name</Label>
                <Input id="goal-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., House Down Payment" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="goal-target">Target Amount (€)</Label>
                  <Input id="goal-target" type="number" min="0" step="0.01" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-current">Current Savings (€)</Label>
                  <Input id="goal-current" type="number" min="0" step="0.01" inputMode="decimal" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="goal-date">Target Date</Label>
                  <Input id="goal-date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-monthly">Monthly Contribution (€)</Label>
                  <Input id="goal-monthly" type="number" min="0" step="0.01" inputMode="decimal" value={monthlyContrib} onChange={e => setMonthlyContrib(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">{editId ? "Update" : "Create"} Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {data.savingsGoals.map(goal => {
          const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
          const isExpanded = expandedGoal === goal.id;
          const history = goal.fundHistory ?? [];
          return (
            <div key={goal.id} className="rounded-xl border border-border/50 overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" aria-hidden="true">{goal.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{goal.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        €{goal.currentAmount.toLocaleString("en", { minimumFractionDigits: 2 })} / €{goal.targetAmount.toLocaleString("en", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold font-mono text-accent">{pct.toFixed(0)}%</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(goal)} aria-label="Edit goal">
                      <Settings2Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSavingsGoal(goal.id)} aria-label="Delete goal">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <Progress value={pct} className="h-2.5" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex gap-3">
                    {goal.targetDate && (
                      <span>{daysUntil(goal.targetDate)} days left · {new Date(goal.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    )}
                    {goal.monthlyContribution && <span>€{goal.monthlyContribution.toFixed(2)}/mo</span>}
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => setFundDialogGoalId(goal.id)}>
                      <Plus className="h-3 w-3" /> Add Funds
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)} aria-expanded={isExpanded}>
                      <History className="h-3 w-3" /> History
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-border/50 px-4 py-3 bg-muted/20 max-h-[200px] overflow-y-auto">
                  {history.length > 0 ? (
                    <div className="space-y-1.5">
                      {history.slice().reverse().map(entry => (
                        <div key={entry.id} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-accent font-mono font-semibold">+€{entry.amount.toFixed(2)}</span>
                            {entry.note && <span className="text-muted-foreground">{entry.note}</span>}
                          </div>
                          <span className="text-muted-foreground">{new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No fund history yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {data.savingsGoals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No savings goals yet. Start planning for your future!</p>
        )}
      </div>

      {/* Add Funds Dialog */}
      <Dialog open={!!fundDialogGoalId} onOpenChange={(v) => { if (!v) setFundDialogGoalId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Funds</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="fund-amount">Amount (€)</Label>
              <Input id="fund-amount" type="number" min="0" step="0.01" inputMode="decimal" value={addFundAmt} onChange={e => setAddFundAmt(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fund-note">Note (optional)</Label>
              <Input id="fund-note" value={addFundNote} onChange={e => setAddFundNote(e.target.value)} placeholder="e.g., Bonus from work" />
            </div>
            <Button onClick={handleAddFunds} className="w-full">Add Funds</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Settings2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
    </svg>
  );
}
