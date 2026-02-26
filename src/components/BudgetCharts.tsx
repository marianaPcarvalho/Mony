import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const COLORS = [
  "hsl(24, 80%, 48%)",
  "hsl(220, 55%, 50%)",
  "hsl(38, 92%, 45%)",
  "hsl(340, 60%, 45%)",
  "hsl(270, 50%, 48%)",
  "hsl(16, 75%, 48%)",
  "hsl(168, 55%, 32%)",
  "hsl(190, 60%, 40%)",
];

export function BudgetCharts() {
  const { data, selectedMonth, getCategorySpent, getPlannedMonthlySavings, getActualSavedInMonth } = useStore();
  const [filterCat, setFilterCat] = useState<string>("all");
  const [pieExpanded, setPieExpanded] = useState(false);
  const [barExpanded, setBarExpanded] = useState(false);

  const plannedSavings = getPlannedMonthlySavings();
  const actualSaved = getActualSavedInMonth(selectedMonth);

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

  const pieData = filteredData
    .map(c => ({ name: c.name, value: c.spent, color: c.color }))
    .filter(d => d.value > 0);

  if (filterCat === "all" && actualSaved > 0) {
    pieData.push({ name: "Savings (actual)", value: actualSaved, color: "hsl(265, 50%, 48%)" });
  }

  const barData = filteredData.map(c => ({
    name: c.name,
    spent: c.spent,
    budget: c.budget,
  }));

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
    if (uncategorized > 0) subData.push({ name: "Other", icon: "📦", spent: uncategorized, color: "hsl(220, 14%, 55%)" });
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

      {selectedCategory && (
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{selectedCategory.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-foreground">{selectedCategory.name}</h4>
                <span className="font-mono text-sm">
                  <span className={selectedCategory.spent > selectedCategory.budget ? "text-destructive font-bold" : "text-foreground font-semibold"}>
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
        {/* Pie Chart - Expandable */}
        <Card className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-foreground">
              {selectedCategory ? "Sub-category Breakdown" : "Spending Distribution"}
            </h4>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => setPieExpanded(!pieExpanded)}>
              {pieExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {pieExpanded ? "Less" : "Details"}
            </Button>
          </div>
          {(selectedCategory ? subBreakdown : pieData).length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={pieExpanded ? 300 : 220}>
                <PieChart>
                  <Pie
                    data={selectedCategory ? subBreakdown.map(s => ({ name: s.name, value: s.spent, color: s.color })) : pieData}
                    cx="50%" cy="50%" innerRadius={pieExpanded ? 60 : 50} outerRadius={pieExpanded ? 110 : 85} dataKey="value" paddingAngle={3} strokeWidth={0}
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
                    <span className="text-foreground font-medium">{d.name}</span>
                    <span className="text-muted-foreground font-mono">€{(d as any).value?.toFixed(0) ?? (d as any).spent?.toFixed(0)}</span>
                  </div>
                ))}
              </div>
              {pieExpanded && (
                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  {(selectedCategory ? subBreakdown.map(s => ({ name: s.name, value: s.spent, color: s.color })) : pieData).map((d, i) => {
                    const total = (selectedCategory ? subBreakdown.reduce((s, x) => s + x.spent, 0) : pieData.reduce((s, x) => s + x.value, 0));
                    const pct = total > 0 ? (d.value / total * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="flex-1 font-medium text-foreground">{d.name}</span>
                        <span className="font-mono text-foreground font-semibold">€{d.value.toFixed(2)}</span>
                        <span className="font-mono text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No spending data yet</div>
          )}
        </Card>

        {/* Bar Chart - Expandable */}
        <Card className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-foreground">Budget vs Spent</h4>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => setBarExpanded(!barExpanded)}>
              {barExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {barExpanded ? "Less" : "Details"}
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={barExpanded ? 350 : 250}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 82%)" opacity={0.5} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(220, 12%, 35%)" }} tickFormatter={(v) => `€${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 12%, 35%)" }} width={80} />
              <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="budget" fill="hsl(220, 55%, 65%)" radius={[0, 4, 4, 0]} barSize={14} name="Budget" />
              <Bar dataKey="spent" fill="hsl(0, 65%, 52%)" radius={[0, 4, 4, 0]} barSize={14} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
          {barExpanded && (
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              {barData.map((d, i) => {
                const pct = d.budget > 0 ? (d.spent / d.budget * 100) : 0;
                const over = d.spent > d.budget;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="flex-1 font-medium text-foreground">{d.name}</span>
                    <span className={`font-mono font-semibold ${over ? "text-destructive" : "text-foreground"}`}>€{d.spent.toFixed(2)}</span>
                    <span className="text-muted-foreground font-mono">/ €{d.budget.toFixed(2)}</span>
                    <span className={`font-mono w-12 text-right font-semibold ${over ? "text-destructive" : pct > 70 ? "text-warning" : "text-success"}`}>{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
