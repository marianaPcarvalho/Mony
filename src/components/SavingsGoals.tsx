import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ICONS = ["🏠", "🚗", "✈️", "🎓", "💍", "🏖️", "📱", "💰", "🎯"];

export function SavingsGoals() {
  const { data, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏠");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");

  const handleAdd = () => {
    if (!name || !target) return;
    addSavingsGoal({ name, icon, targetAmount: parseFloat(target), currentAmount: parseFloat(current || "0"), color: "hsl(var(--accent))" });
    setOpen(false);
    setName("");
    setTarget("");
    setCurrent("");
  };

  const handleAddFunds = (goal: typeof data.savingsGoals[0], amount: number) => {
    updateSavingsGoal({ ...goal, currentAmount: goal.currentAmount + amount });
  };

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Savings Goals</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-3.5 w-3.5" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Savings Goal</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(i => (
                    <button key={i} onClick={() => setIcon(i)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${icon === i ? "bg-accent/20 ring-2 ring-accent" : "bg-muted hover:bg-muted/80"}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., House Down Payment" />
              </div>
              <div className="space-y-2">
                <Label>Target Amount (€)</Label>
                <Input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Current Savings (€)</Label>
                <Input type="number" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0.00" />
              </div>
              <Button onClick={handleAdd} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {data.savingsGoals.map(goal => {
          const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
          return (
            <div key={goal.id} className="p-4 rounded-xl bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{goal.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      €{goal.currentAmount.toLocaleString()} / €{goal.targetAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold font-mono text-accent">{pct.toFixed(0)}%</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSavingsGoal(goal.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <Progress value={pct} className="h-2.5" />
              <div className="flex gap-2">
                {[50, 100, 500].map(amt => (
                  <Button key={amt} variant="outline" size="sm" className="text-xs h-7" onClick={() => handleAddFunds(goal, amt)}>
                    +€{amt}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
        {data.savingsGoals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No savings goals yet. Start planning for your future!
          </p>
        )}
      </div>
    </Card>
  );
}
