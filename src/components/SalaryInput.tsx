import { useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DollarSign, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SalaryInput() {
  const { selectedMonth, getSalary, setSalary, getBudget, setBudget } = useStore();
  const currentSalary = getSalary(selectedMonth);
  const currentBudget = getBudget(selectedMonth);
  const [open, setOpen] = useState(false);
  const [salaryVal, setSalaryVal] = useState("");
  const [budgetVal, setBudgetVal] = useState("");

  const handleOpen = () => {
    setSalaryVal(String(currentSalary));
    setBudgetVal(String(currentBudget));
    setOpen(true);
  };

  const handleSave = () => {
    setSalary(selectedMonth, parseFloat(salaryVal) || 0);
    setBudget(selectedMonth, parseFloat(budgetVal) || 0);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button onClick={handleOpen} className="text-left" aria-label="Edit salary and budget">
          <Card className="glass-card p-2.5 flex items-center gap-2.5 hover:border-accent/50 transition-colors cursor-pointer">
            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center" aria-hidden="true">
              <DollarSign className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">Salary / Budget</p>
              <p className="font-mono font-bold text-xs text-foreground">
                €{currentSalary.toLocaleString("en", { minimumFractionDigits: 2 })} / €{(currentBudget || 0).toLocaleString("en", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </Card>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Monthly Salary &amp; Budget</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="salary-input">Monthly Salary (€)</Label>
            <Input id="salary-input" type="number" min="0" step="0.01" inputMode="decimal" value={salaryVal} onChange={e => setSalaryVal(e.target.value)} placeholder="0.00" />
            <p className="text-xs text-muted-foreground">Your total income for this month.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-input">Monthly Budget (€)</Label>
            <Input id="budget-input" type="number" min="0" step="0.01" inputMode="decimal" value={budgetVal} onChange={e => setBudgetVal(e.target.value)} placeholder="0.00" />
            <p className="text-xs text-muted-foreground">Maximum you plan to spend this month (separate from salary).</p>
          </div>
          <Button onClick={handleSave} className="w-full">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
