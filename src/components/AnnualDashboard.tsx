import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = [
  "hsl(24, 80%, 48%)",
  "hsl(220, 55%, 50%)",
  "hsl(38, 92%, 45%)",
  "hsl(340, 60%, 45%)",
  "hsl(270, 50%, 48%)",
  "hsl(16, 75%, 48%)",
];

export function AnnualDashboard() {
  const { data, getCategorySpent, getSalary, getBudget, getTotalSpent, getPlannedMonthlySavings, getActualSavedInMonth } = useStore();
  const year = new Date().getFullYear();
  const plannedMonthlySavings = getPlannedMonthlySavings();

  const monthlyData = MONTHS.map((name, idx) => {
    const month = `${year}-${String(idx + 1).padStart(2, "0")}`;
    const salary = getSalary(month);
    const budget = getBudget(month);
    const spent = getTotalSpent(month);
    const budgeted = data.yearlyPlans.filter(p => p.month === idx).reduce((s, p) => s + p.amount, 0);
    const actualSaved = getActualSavedInMonth(month);
    return { name, salary, budget, spent, budgeted, savings: actualSaved, remaining: (budget || salary) - spent };
  });

  const totalSpentYear = monthlyData.reduce((s, m) => s + m.spent, 0);
  const totalSalaryYear = monthlyData.reduce((s, m) => s + m.salary, 0);
  const totalBudgetedYear = monthlyData.reduce((s, m) => s + m.budgeted, 0);
  const totalActualSaved = monthlyData.reduce((s, m) => s + m.savings, 0);
  const totalPlannedSavings = plannedMonthlySavings * 12;

  const categoryYearData = data.categories.map((c, i) => {
    const total = MONTHS.reduce((s, _, idx) => {
      const month = `${year}-${String(idx + 1).padStart(2, "0")}`;
      return s + getCategorySpent(c.id, month);
    }, 0);
    return { name: c.name, icon: c.icon, value: total, color: COLORS[i % COLORS.length], yearlyBudget: c.monthlyBudget * 12 };
  }).filter(c => c.value > 0);

  const fmt = (v: number) => `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="glass-card p-4 space-y-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Total Income</p>
          <p className="text-lg font-bold font-mono text-foreground">{fmt(totalSalaryYear)}</p>
        </Card>
        <Card className="glass-card p-4 space-y-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Total Spent</p>
          <p className="text-lg font-bold font-mono text-destructive">{fmt(totalSpentYear)}</p>
        </Card>
        <Card className="glass-card p-4 space-y-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Actual Savings</p>
          <p className="text-lg font-bold font-mono text-[hsl(var(--savings))]">{fmt(totalActualSaved)}</p>
        </Card>
        <Card className="glass-card p-4 space-y-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Planned Savings</p>
          <p className="text-lg font-bold font-mono text-muted-foreground">{fmt(totalPlannedSavings)}</p>
        </Card>
        <Card className="glass-card p-4 space-y-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Budgeted Expenses</p>
          <p className="text-lg font-bold font-mono text-foreground">{fmt(totalBudgetedYear)}</p>
        </Card>
      </div>

      <Card className="glass-card p-5">
        <h4 className="text-sm font-medium text-foreground mb-4">Monthly Overview — {year}</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 82%)" opacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 12%, 35%)" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220, 12%, 35%)" }} tickFormatter={(v) => `€${v}`} />
            <Tooltip formatter={(value: number, name: string) => [`€${value.toFixed(2)}`, name]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="salary" fill="hsl(220, 55%, 50%)" radius={[4, 4, 0, 0]} barSize={14} name="Income" />
            <Bar dataKey="spent" fill="hsl(0, 65%, 52%)" radius={[4, 4, 0, 0]} barSize={14} name="Spent" />
            <Bar dataKey="savings" fill="hsl(265, 50%, 48%)" radius={[4, 4, 0, 0]} barSize={14} name="Savings" />
            <Bar dataKey="budgeted" fill="hsl(38, 92%, 45%)" radius={[4, 4, 0, 0]} barSize={14} name="Budgeted" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card p-5">
          <h4 className="text-sm font-medium text-foreground mb-4">Annual Spending by Category</h4>
          {categoryYearData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryYearData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {categoryYearData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {categoryYearData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} aria-hidden="true" />
                    <span className="text-foreground font-medium">{d.name}</span>
                    <span className="text-muted-foreground font-mono">€{d.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No spending data for {year}</div>
          )}
        </Card>

        <Card className="glass-card p-5">
          <h4 className="text-sm font-medium text-foreground mb-4">Annual Budget Usage</h4>
          <div className="space-y-3">
            {data.categories.map((cat, i) => {
              const yearSpent = MONTHS.reduce((s, _, idx) => {
                const month = `${year}-${String(idx + 1).padStart(2, "0")}`;
                return s + getCategorySpent(cat.id, month);
              }, 0);
              const yearBudget = cat.monthlyBudget * 12;
              const pct = yearBudget > 0 ? Math.min((yearSpent / yearBudget) * 100, 100) : 0;
              const over = yearSpent > yearBudget;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden="true">{cat.icon}</span>
                      <span className="font-medium text-foreground">{cat.name}</span>
                    </span>
                    <span className="font-mono">
                      <span className={over ? "text-destructive font-bold" : "text-foreground font-semibold"}>{fmt(yearSpent)}</span>
                      <span className="text-muted-foreground"> / {fmt(yearBudget)}</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: over ? "hsl(0, 65%, 52%)" : COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
