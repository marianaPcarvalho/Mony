import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function OverviewCards() {
  const { selectedMonth, getSalary, setSalary, getBudget, setBudget, getTotalSpent, getTotalBudget, getActualSavedTotal, data } = useStore();
  const salary = getSalary(selectedMonth);
  const monthlyBudget = getBudget(selectedMonth);
  const spent = getTotalSpent(selectedMonth);
  const totalSaved = getActualSavedTotal();
  const categoryBudgets = getTotalBudget();
  const effectiveBudget = monthlyBudget || categoryBudgets;
  const remaining = effectiveBudget - spent;

  const [editOpen, setEditOpen] = useState(false);
  const [salaryVal, setSalaryVal] = useState("");
  const [budgetVal, setBudgetVal] = useState("");

  const openEdit = () => {
    setSalaryVal(String(salary));
    setBudgetVal(String(monthlyBudget));
    setEditOpen(true);
  };

  const handleSave = () => {
    setSalary(selectedMonth, parseFloat(salaryVal) || 0);
    setBudget(selectedMonth, parseFloat(budgetVal) || 0);
    setEditOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  const fmt = (v: number) => `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Find the active tab setter from parent - we'll use a workaround
  const openSavingsTab = () => {
    const savingsTab = document.querySelector('[data-value="savings"]') as HTMLButtonElement | null;
    if (savingsTab) savingsTab.click();
  };

  const cards = [
    { label: "Salary", value: fmt(salary), icon: Wallet, editable: true },
    { label: "Monthly Budget", value: fmt(effectiveBudget), icon: Target, editable: true },
    { label: "Total Spent", value: fmt(spent), icon: TrendingDown, destructive: spent > effectiveBudget },
    { label: "Remaining", value: fmt(remaining), icon: TrendingUp, destructive: remaining < 0, success: remaining > 0 },
    { label: "Current Savings", value: fmt(totalSaved), icon: PiggyBank, isSavings: true, clickable: true },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <Card
            key={c.label}
            className={`glass-card p-4 space-y-1 ${c.editable || c.clickable ? "cursor-pointer hover:border-primary/30 transition-colors" : ""}`}
            onClick={c.editable ? openEdit : c.clickable ? openSavingsTab : undefined}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Monthly Salary &amp; Budget</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="ov-salary">Monthly Salary (€)</Label>
              <Input id="ov-salary" type="number" min="0" step="0.01" inputMode="decimal" value={salaryVal} onChange={e => setSalaryVal(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ov-budget">Monthly Budget (€)</Label>
              <Input id="ov-budget" type="number" min="0" step="0.01" inputMode="decimal" value={budgetVal} onChange={e => setBudgetVal(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" />
            </div>
            <Button onClick={handleSave} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
