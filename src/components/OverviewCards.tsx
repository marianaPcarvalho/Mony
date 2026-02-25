import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target } from "lucide-react";

export function OverviewCards() {
  const { selectedMonth, getSalary, getBudget, getTotalSpent, getTotalBudget, getTotalSavingsMonthly } = useStore();
  const salary = getSalary(selectedMonth);
  const monthlyBudget = getBudget(selectedMonth);
  const spent = getTotalSpent(selectedMonth);
  const savings = getTotalSavingsMonthly();
  const remaining = salary - spent - savings;
  const categoryBudgets = getTotalBudget();
  const budgetUsed = categoryBudgets > 0 ? (spent / categoryBudgets) * 100 : 0;

  const fmt = (v: number) => `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cards = [
    { label: "Salary", value: fmt(salary), icon: Wallet, accent: false },
    { label: "Monthly Budget", value: fmt(monthlyBudget || categoryBudgets), icon: Target, accent: false },
    { label: "Total Spent", value: fmt(spent), icon: TrendingDown, destructive: spent > (monthlyBudget || categoryBudgets) },
    { label: "Savings/mo", value: fmt(savings), icon: PiggyBank, accent: true },
    { label: "Remaining", value: fmt(remaining), icon: TrendingUp, destructive: remaining < 0 },
    { label: "Budget Used", value: `${budgetUsed.toFixed(0)}%`, icon: Target, warning: budgetUsed > 70, destructive: budgetUsed > 90 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.destructive ? "text-destructive" : c.warning ? "text-warning" : c.accent ? "text-accent" : "text-muted-foreground"}`} />
          </div>
          <p className={`text-lg font-bold font-mono tracking-tight ${c.destructive ? "text-destructive" : c.accent ? "text-accent" : "text-foreground"}`}>
            {c.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
