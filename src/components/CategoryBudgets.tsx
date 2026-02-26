import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ICONS = ["🏠", "🍕", "🚗", "🎬", "💊", "🛍️", "📱", "✈️", "📚", "💡", "🏋️", "🎮", "👶", "🐕", "💰", "🎵", "🔧", "🧾", "☕", "🎨", "🏥", "🎁", "💇", "🧹", "📮", "🎓", "🍺", "🏊", "⛽", "🅿️"];

export function CategoryBudgets() {
  const { data, selectedMonth, getCategorySpent, addCategory } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const [newBudget, setNewBudget] = useState("");

  const sorted = [...data.categories]
    .map(c => ({ ...c, spent: getCategorySpent(c.id, selectedMonth) }))
    .sort((a, b) => b.spent - a.spent);

  const visibleCats = expanded ? sorted : sorted.slice(0, 5);

  const handleAddCategory = () => {
    if (!newName || !newBudget) return;
    addCategory({ name: newName, icon: newIcon, color: `hsl(var(--chart-${(data.categories.length % 6) + 1}))`, monthlyBudget: parseFloat(newBudget), subCategories: [] });
    setAddOpen(false);
    setNewName("");
    setNewIcon("📦");
    setNewBudget("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddCategory();
  };

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Category Budgets</h3>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" aria-label="Add new category">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto" role="radiogroup">
                  {ICONS.map(i => (
                    <button key={i} onClick={() => setNewIcon(i)} role="radio" aria-checked={newIcon === i}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors ${newIcon === i ? "bg-accent/15 ring-2 ring-accent" : "bg-muted hover:bg-muted/80"}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cb-name">Name</Label>
                <Input id="cb-name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., Groceries" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cb-budget">Monthly Budget (€)</Label>
                <Input id="cb-budget" type="number" min="0" step="0.01" inputMode="decimal" value={newBudget} onChange={e => setNewBudget(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" />
              </div>
              <Button onClick={handleAddCategory} className="w-full">Create Category</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {visibleCats.map(cat => {
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
          <p className="text-sm text-muted-foreground text-center py-4">No categories yet. Add one above!</p>
        )}
      </div>
      {sorted.length > 5 && (
        <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show all {sorted.length} categories</>}
        </Button>
      )}
    </Card>
  );
}
