import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const COLORS = [
  "hsl(168, 55%, 38%)",
  "hsl(220, 55%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(340, 60%, 50%)",
  "hsl(270, 45%, 50%)",
  "hsl(16, 75%, 50%)",
];

export function BudgetCharts() {
  const { data, selectedMonth, getCategorySpent, getTotalSavingsMonthly } = useStore();
  const [filterCat, setFilterCat] = useState<string>("all");

  const monthlySavings = getTotalSavingsMonthly();

  // Category data
  const categoryData = data.categories.map((c, i) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    spent: getCategorySpent(c.id, selectedMonth),
    budget: c.monthlyBudget,
    color: COLORS[i % COLORS.length],
    subCategories: c.subCategories ?? [],
  }));

  const filteredData = filterCat === "all" ? categoryData : categoryData.filter(c => c.id === filterCat);
  const selectedCategory = filterCat !== "all" ? categoryData.find(c => c.id === filterCat) : null;

  // Pie data
  const pieData = filteredData
    .map(c => ({ name: c.name, value: c.spent, color: c.color }))
    .filter(d => d.value > 0);

  // Add savings to pie if viewing all
  if (filterCat === "all" && monthlySavings > 0) {
    pieData.push({ name: "Savings", value: monthlySavings, color: "hsl(152, 55%, 36%)" });
  }

  // Bar data
  const barData = filteredData.map(c => ({
    name: c.name,
    spent: c.spent,
    budget: c.budget,
    fill: c.color,
  }));

  // Sub-category breakdown for filtered view
  const subBreakdown = selectedCategory ? (() => {
    const expenses = data.expenses.filter(e => e.date.startsWith(selectedMonth) && e.categoryId === selectedCategory.id);
    const subs = selectedCategory.subCategories;
    const subData = subs.map((s, i) => ({
      name: s.name,
      icon: s.icon,
      spent: expenses.filter(e => e.subCategoryId === s.id).reduce((sum, e) => sum + e.amount, 0),
      color: COLORS[(i + 2) % COLORS.length],
    }));
    const uncategorized = expenses.filter(e => !e.subCategoryId).reduce((sum, e) => sum + e.amount, 0);
    if (uncategorized > 0) subData.push({ name: "Other", icon: "📦", spent: uncategorized, color: "hsl(220, 14%, 70%)" });
    return subData.filter(s => s.spent > 0);
  })() : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Charts</h3>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="h-8 text-xs w-[160px]" aria-label="Filter charts by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {data.categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category detail header */}
      {selectedCategory && (
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{selectedCategory.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{selectedCategory.name}</h4>
                <span className="font-mono text-sm">
                  <span className={selectedCategory.spent > selectedCategory.budget ? "text-destructive font-bold" : "text-foreground"}>
                    €{selectedCategory.spent.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground"> / €{selectedCategory.budget.toFixed(2)}</span>
                </span>
              </div>
              <Progress value={Math.min((selectedCategory.spent / selectedCategory.budget) * 100, 100)} className="h-2 mt-2" />
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card p-5">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">
            {selectedCategory ? "Sub-category Breakdown" : "Spending Distribution"}
          </h4>
          {(selectedCategory ? subBreakdown : pieData).length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={selectedCategory ? subBreakdown.map(s => ({ name: s.name, value: s.spent, color: s.color })) : pieData}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3} strokeWidth={0}
                  >
                    {(selectedCategory ? subBreakdown : pieData).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {(selectedCategory ? subBreakdown : pieData).map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} aria-hidden="true" />
                    <span className="text-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No spending data yet</div>
          )}
        </Card>

        <Card className="glass-card p-5">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Budget vs Spent</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 86%)" opacity={0.5} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(220, 10%, 40%)" }} tickFormatter={(v) => `€${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 10%, 40%)" }} width={80} />
              <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
              <Bar dataKey="budget" fill="hsl(220, 14%, 86%)" radius={[0, 4, 4, 0]} barSize={14} name="Budget" />
              <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={14} name="Spent">
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
