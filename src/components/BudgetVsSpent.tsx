import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { buildCategoryPalette } from "@/lib/colors";

export function BudgetVsSpent() {
  const { data, selectedMonth, getCategorySpent } = useStore();

  const fmt = (v: number) =>
    `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const palette = buildCategoryPalette(data.categories.length);
  const rows = data.categories.map((c, i) => {
    const spent = getCategorySpent(c.id, selectedMonth);
    const budget = c.monthlyBudget || 0;
    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const over = budget > 0 && spent > budget;
    return {
      id: c.id,
      name: c.name,
      icon: c.icon,
      spent,
      budget,
      pct,
      over,
      color: palette[i] ?? `hsl(${(i * 53) % 360}, 70%, 52%)`,
    };
  });

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" /> Budget vs Spent
        </h3>
      </div>

      <ul className="space-y-3" aria-label="Budget vs spent by category">
        {rows.map((r) => (
          <li key={r.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span aria-hidden="true">{r.icon}</span>
                <span className="font-medium text-foreground truncate">{r.name}</span>
              </div>
              <div className="font-mono text-xs flex-shrink-0">
                <span className={r.over ? "text-destructive font-bold" : "text-foreground font-semibold"}>
                  {fmt(r.spent)}
                </span>
                <span className="text-muted-foreground"> / {fmt(r.budget)}</span>
              </div>
            </div>
            <Progress
              value={r.pct}
              className="h-2"
              style={{ ["--progress-color" as any]: r.over ? "hsl(var(--destructive))" : r.color }}
              aria-label={`${r.name}: spent ${fmt(r.spent)} of ${fmt(r.budget)} budget`}
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{r.budget > 0 ? `${Math.round((r.spent / r.budget) * 100)}% used` : "No budget set"}</span>
              {r.over && <span className="text-destructive font-semibold">Over by {fmt(r.spent - r.budget)}</span>}
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-sm text-muted-foreground text-center py-6">No categories yet.</li>
        )}
      </ul>
    </Card>
  );
}
