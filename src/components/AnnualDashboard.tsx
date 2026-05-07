import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell,
} from "recharts";
import { Wallet, TrendingDown, PiggyBank, Target, ClipboardList } from "lucide-react";
import { YearlyPlanner } from "@/components/YearlyPlanner";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

const fmt = (v: number) => `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt0 = (v: number) => `€${v.toLocaleString("en", { maximumFractionDigits: 0 })}`;

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
    return { name, salary, budget, spent, budgeted, savings: actualSaved };
  });

  const totalSpentYear = monthlyData.reduce((s, m) => s + m.spent, 0);
  const totalSalaryYear = monthlyData.reduce((s, m) => s + m.salary, 0);
  const totalBudgetedYear = monthlyData.reduce((s, m) => s + m.budgeted, 0);
  const totalActualSaved = monthlyData.reduce((s, m) => s + m.savings, 0);
  const totalPlannedSavings = plannedMonthlySavings * 12;

  const categoryYearData = data.categories
    .map((c, i) => {
      const total = MONTHS.reduce((s, _, idx) => {
        const month = `${year}-${String(idx + 1).padStart(2, "0")}`;
        return s + getCategorySpent(c.id, month);
      }, 0);
      return {
        id: c.id, name: c.name, icon: c.icon,
        value: total,
        color: COLORS[i % COLORS.length],
        yearlyBudget: c.monthlyBudget * 12,
      };
    })
    .filter(c => c.value > 0);

  const stats = [
    { label: "Total income", value: fmt(totalSalaryYear), icon: Wallet, tone: "success" as const },
    { label: "Total spent", value: fmt(totalSpentYear), icon: TrendingDown, tone: "destructive" as const },
    { label: "Actual savings", value: fmt(totalActualSaved), icon: PiggyBank, tone: "success" as const },
    { label: "Planned savings", value: fmt(totalPlannedSavings), icon: Target, tone: "neutral" as const },
    { label: "Budgeted expenses", value: fmt(totalBudgetedYear), icon: ClipboardList, tone: "neutral" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Hero — same shape as HomeHero */}
      <Card className="glass-card p-6">
        <div className="flex items-baseline justify-between gap-3 mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Annual <span className="text-muted-foreground font-medium ml-2 text-base">{year}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: donut + breakdown list */}
          <div className="space-y-4">
            <div
              className="relative"
              role="img"
              aria-label={`Yearly spending donut for ${year}. Total ${fmt(totalSpentYear)} across ${categoryYearData.length} categories.`}
            >
              {categoryYearData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={260} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={categoryYearData}
                        cx="50%" cy="50%"
                        innerRadius="58%" outerRadius="88%"
                        dataKey="value" paddingAngle={1}
                        stroke="hsl(var(--card))" strokeWidth={2}
                        isAnimationActive={false}
                        style={{ pointerEvents: "none", outline: "none" }}
                      >
                        {categoryYearData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} style={{ outline: "none" }} />
                        ))}
                      </Pie>
                      <Tooltip
                        wrapperStyle={{ outline: "none", fontSize: 12 }}
                        contentStyle={{
                          padding: "6px 10px", borderRadius: 8, fontSize: 12,
                          background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))",
                          border: "1px solid hsl(var(--border))",
                        }}
                        formatter={(value: number, _name, item: any) => {
                          const total = categoryYearData.reduce((s, p) => s + p.value, 0);
                          const pct = total > 0 ? (value / total) * 100 : 0;
                          return [`€${value.toFixed(2)} (${pct.toFixed(1)}%)`, item?.payload?.name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ height: 260 }}>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Spent in {year}</span>
                    <span className="font-mono font-bold text-xl text-foreground">{fmt(totalSpentYear)}</span>
                  </div>
                </>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                  No spending data for {year}
                </div>
              )}
            </div>

            {categoryYearData.length > 0 ? (
              <ul className="space-y-1.5" aria-label="Yearly spending breakdown">
                {categoryYearData
                  .slice()
                  .sort((a, b) => b.value - a.value)
                  .map((d, i) => {
                    const total = categoryYearData.reduce((s, p) => s + p.value, 0);
                    const pct = total > 0 ? (d.value / total) * 100 : 0;
                    return (
                      <li key={i} className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} aria-hidden="true" />
                          <span className="text-sm font-medium text-foreground truncate">{d.icon} {d.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-sm font-semibold text-foreground">{fmt(d.value)}</span>
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground text-center">Add expenses to see your breakdown.</div>
            )}
          </div>

          {/* Right: stats column */}
          <div className="space-y-3">
            {stats.map(s => (
              <div key={s.label} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                    s.tone === "success" ? "bg-success/15 text-success" :
                    s.tone === "destructive" ? "bg-destructive/15 text-destructive" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{s.label}</span>
                </div>
                <span className={`font-mono font-bold text-lg ${
                  s.tone === "success" ? "text-success" :
                  s.tone === "destructive" ? "text-destructive" : "text-foreground"
                }`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Monthly overview chart */}
      <Card className="glass-card p-5 space-y-3">
        <h3 className="section-title flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" /> Monthly overview
        </h3>
        <div role="img" aria-label="Monthly overview bar chart showing income, spent, savings and budgeted per month.">
          <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => fmt0(Number(v))}
                tickLine={false} axisLine={false} width={55}
              />
              <Tooltip
                wrapperStyle={{ outline: "none", fontSize: 12 }}
                contentStyle={{
                  padding: "6px 10px", borderRadius: 8, fontSize: 12,
                  background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))",
                  border: "1px solid hsl(var(--border))",
                }}
                formatter={(value: number, name: string) => [fmt(Number(value)), name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} iconType="circle" />
              <Bar dataKey="salary" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} barSize={14} name="Income" isAnimationActive={false} />
              <Bar dataKey="spent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={14} name="Spent" isAnimationActive={false} />
              <Bar dataKey="savings" fill="hsl(var(--savings))" radius={[4, 4, 0, 0]} barSize={14} name="Savings" isAnimationActive={false} />
              <Bar dataKey="budgeted" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} barSize={14} name="Budgeted" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Annual budget usage */}
      <Card className="glass-card p-5 space-y-4">
        <h3 className="section-title flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" /> Annual budget usage
        </h3>
        <div className="space-y-3">
          {data.categories.map((cat, i) => {
            const yearSpent = MONTHS.reduce((s, _, idx) => {
              const month = `${year}-${String(idx + 1).padStart(2, "0")}`;
              return s + getCategorySpent(cat.id, month);
            }, 0);
            const yearBudget = cat.monthlyBudget * 12;
            const pct = yearBudget > 0 ? Math.min((yearSpent / yearBudget) * 100, 100) : 0;
            const over = yearBudget > 0 && yearSpent > yearBudget;
            const color = over ? "hsl(var(--destructive))" : COLORS[i % COLORS.length];

            return (
              <div key={cat.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg" aria-hidden="true">{cat.icon}</span>
                    <span className="font-semibold text-sm text-foreground truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 font-mono text-xs">
                    <span className={over ? "text-destructive font-bold" : "text-foreground font-semibold"}>{fmt(yearSpent)}</span>
                    <span className="text-muted-foreground">/ {fmt(yearBudget)}</span>
                    <span className={`tabular-nums w-12 text-right font-bold ${over ? "text-destructive" : "text-foreground"}`}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={pct}
                  className="h-2"
                  style={{ ["--progress-color" as any]: color }}
                  aria-label={`${cat.name}: ${pct.toFixed(0)} percent of yearly budget used`}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <YearlyPlanner />
    </div>
  );
}
