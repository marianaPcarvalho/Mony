import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

export function OverviewCards() {
  const { selectedMonth, getSalary, getTotalSpent, getTotalBudget } = useStore();
  const salary = getSalary(selectedMonth);
  const spent = getTotalSpent(selectedMonth);
  const remaining = salary - spent;
  const budget = getTotalBudget();
  const budgetUsed = budget > 0 ? (spent / budget) * 100 : 0;

  const cards = [
    { label: "Salary", value: salary, icon: Wallet, color: "text-accent" },
    { label: "Total Spent", value: spent, icon: TrendingDown, color: "text-destructive" },
    { label: "Remaining", value: remaining, icon: TrendingUp, color: remaining >= 0 ? "text-success" : "text-destructive" },
    { label: "Budget Used", value: budgetUsed, icon: PiggyBank, color: budgetUsed > 90 ? "text-destructive" : budgetUsed > 70 ? "text-warning" : "text-accent", isBudget: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <p className={`stat-value ${c.color}`}>
            {"isBudget" in c && c.isBudget ? `${c.value.toFixed(0)}%` : `€${c.value.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </Card>
      ))}
    </div>
  );
}
