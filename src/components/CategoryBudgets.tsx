import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function CategoryBudgets() {
  const { data, selectedMonth, getCategorySpent } = useStore();

  const sorted = [...data.categories]
    .map(c => ({ ...c, spent: getCategorySpent(c.id, selectedMonth) }))
    .sort((a, b) => b.spent - a.spent);

  return (
    <Card className="glass-card p-5 space-y-4">
      <h3 className="section-title">Category Budgets</h3>
      <div className="space-y-3">
        {sorted.map(cat => {
          const pct = cat.monthlyBudget > 0 ? Math.min((cat.spent / cat.monthlyBudget) * 100, 100) : 0;
          const over = cat.spent > cat.monthlyBudget;
          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{cat.icon}</span>
                  <span className="font-medium text-foreground">{cat.name}</span>
                </span>
                <span className="font-mono text-xs">
                  <span className={over ? "text-destructive font-bold" : "text-foreground font-semibold"}>€{cat.spent.toFixed(2)}</span>
                  <span className="text-muted-foreground"> / €{cat.monthlyBudget.toFixed(2)}</span>
                </span>
              </div>
              <Progress
                value={pct}
                className="h-2"
                style={{
                  ["--progress-color" as string]: over ? "hsl(var(--destructive))" : pct > 70 ? "hsl(var(--warning))" : "hsl(var(--accent))"
                }}
              />
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No categories yet</p>
        )}
      </div>
    </Card>
  );
}
