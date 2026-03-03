import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, Pencil, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function OverviewCards({ onOpenSavings }: { onOpenSavings?: () => void }) {
  const { selectedMonth, getSalary, setSalary, getBudget, setBudget, getTotalSpent, getTotalBudget, getActualSavedTotal, data, setMonthStartDay } = useStore();
  const salary = getSalary(selectedMonth);
  const monthlyBudget = getBudget(selectedMonth);
  const spent = getTotalSpent(selectedMonth);
  const totalSaved = getActualSavedTotal();
  const categoryBudgets = getTotalBudget();
  const effectiveBudget = monthlyBudget || categoryBudgets;
  const remaining = effectiveBudget - spent;

  const [salaryOpen, setSalaryOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [salaryVal, setSalaryVal] = useState("");
  const [budgetVal, setBudgetVal] = useState("");

  const openSalaryEdit = () => {
    setSalaryVal(String(salary));
    setSalaryOpen(true);
  };

  const openBudgetEdit = () => {
    setBudgetVal(String(monthlyBudget));
    setBudgetOpen(true);
  };

  const handleSaveSalary = () => {
    setSalary(selectedMonth, parseFloat(salaryVal) || 0);
    setSalaryOpen(false);
  };

  const handleSaveBudget = () => {
    setBudget(selectedMonth, parseFloat(budgetVal) || 0);
    setBudgetOpen(false);
  };

  const handleKeyDownSalary = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveSalary();
  };

  const handleKeyDownBudget = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveBudget();
  };

  const fmt = (v: number) => `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cards = [
    { label: "Salary", value: fmt(salary), icon: Wallet, onClick: openSalaryEdit, editable: true },
    { label: "Monthly Budget", value: fmt(effectiveBudget), icon: Target, onClick: openBudgetEdit, editable: true },
    { label: "Total Spent", value: fmt(spent), icon: TrendingDown, destructive: spent > effectiveBudget },
    { label: "Remaining", value: fmt(remaining), icon: TrendingUp, destructive: remaining < 0, success: remaining > 0 },
    { label: "Current Savings", value: fmt(totalSaved), icon: PiggyBank, isSavings: true, onClick: onOpenSavings, clickable: true },
  ];

  const monthStartDay = data.monthStartDay ?? 1;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <Card
            key={c.label}
            className={`glass-card p-4 space-y-1 ${c.editable || c.clickable ? "cursor-pointer hover:border-primary/30 transition-colors" : ""}`}
            onClick={c.onClick}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{c.label}</span>
              {c.editable ? (
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <c.icon className={`h-4 w-4 ${c.destructive ? "text-destructive" : c.isSavings ? "text-[hsl(var(--savings))]" : c.success ? "text-success" : "text-muted-foreground"}`} />
              )}
            </div>
            <p className={`text-lg font-bold font-mono tracking-tight ${c.destructive ? "text-destructive" : c.isSavings ? "text-[hsl(var(--savings))]" : c.success ? "text-success" : "text-foreground"}`}>
              {c.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Month start day setting button */}
      <div className="flex justify-end -mt-1">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 h-7" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="h-3 w-3" /> Month starts on day {monthStartDay}
        </Button>
      </div>

      {/* Salary dialog */}
      <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Monthly Salary</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="ov-salary">Salary (€)</Label>
              <Input id="ov-salary" type="number" min="0" step="0.01" inputMode="decimal" value={salaryVal} onChange={e => setSalaryVal(e.target.value)} onKeyDown={handleKeyDownSalary} placeholder="0.00" autoFocus />
            </div>
            <Button onClick={handleSaveSalary} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Budget dialog */}
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Monthly Budget</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="ov-budget">Budget (€)</Label>
              <Input id="ov-budget" type="number" min="0" step="0.01" inputMode="decimal" value={budgetVal} onChange={e => setBudgetVal(e.target.value)} onKeyDown={handleKeyDownBudget} placeholder="0.00" autoFocus />
            </div>
            <Button onClick={handleSaveBudget} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Month start day settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Month Start Day</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Choose which day of the month your budget cycle starts. Expenses will be grouped from this day to the same day of the next month.
            </p>
            <div className="space-y-2">
              <Label>Start day</Label>
              <Select value={String(monthStartDay)} onValueChange={(v) => { setMonthStartDay(parseInt(v)); setSettingsOpen(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <SelectItem key={d} value={String(d)}>Day {d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
