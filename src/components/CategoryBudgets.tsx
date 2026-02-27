import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, ChevronDown, ChevronUp, Settings2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CategoryBudgets() {
  const { data, selectedMonth, getCategorySpent, addCategory, updateCategory, deleteCategory, addSubCategory, deleteSubCategory } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const [newBudget, setNewBudget] = useState("");
  const [subOpen, setSubOpen] = useState(false);
  const [subName, setSubName] = useState("");
  const [subIcon, setSubIcon] = useState("📦");
  const [subCatParent, setSubCatParent] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const sorted = [...data.categories]
    .map(c => ({ ...c, spent: getCategorySpent(c.id, selectedMonth) }))
    .sort((a, b) => b.spent - a.spent);

  const visibleCats = expanded ? sorted : sorted.slice(0, 5);

  const resetForm = () => { setNewName(""); setNewIcon("📦"); setNewBudget(""); setEditId(null); };

  const handleSave = () => {
    if (!newName || !newBudget) return;
    if (editId) {
      const existing = data.categories.find(c => c.id === editId);
      if (existing) updateCategory({ ...existing, name: newName, icon: newIcon, monthlyBudget: parseFloat(newBudget) });
    } else {
      addCategory({ name: newName, icon: newIcon, color: `hsl(var(--chart-${(data.categories.length % 6) + 1}))`, monthlyBudget: parseFloat(newBudget), subCategories: [] });
    }
    setAddOpen(false);
    resetForm();
  };

  const handleEdit = (cat: typeof data.categories[0]) => {
    setEditId(cat.id);
    setNewName(cat.name);
    setNewIcon(cat.icon);
    setNewBudget(String(cat.monthlyBudget));
    setAddOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  const handleAddSub = () => {
    if (!subName || !subCatParent) return;
    addSubCategory(subCatParent, { name: subName, icon: subIcon });
    setSubOpen(false);
    setSubName("");
    setSubIcon("📦");
  };

  const handleSubKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddSub();
  };

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Category Budgets</h3>
        <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" aria-label="Add new category">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Category</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  value={newIcon}
                  onChange={e => setNewIcon(e.target.value)}
                  placeholder="Type or paste an emoji"
                  className="text-2xl text-center h-12"
                  maxLength={2}
                />
                <p className="text-[10px] text-muted-foreground">
                  Use your system emoji picker (⌘+⌃+Space on Mac, Win+. on Windows)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cb-name">Name</Label>
                <Input id="cb-name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., Groceries" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cb-budget">Monthly Budget (€)</Label>
                <Input id="cb-budget" type="number" min="0" step="0.01" inputMode="decimal" value={newBudget} onChange={e => setNewBudget(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" />
              </div>
              <Button onClick={handleSave} className="w-full">{editId ? "Update" : "Create"} Category</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {visibleCats.map(cat => {
          const pct = cat.monthlyBudget > 0 ? Math.min((cat.spent / cat.monthlyBudget) * 100, 100) : 0;
          const over = cat.spent > cat.monthlyBudget;
          const subs = cat.subCategories ?? [];
          const isExpanded = expandedCat === cat.id;
          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm group">
                <button className="flex items-center gap-2 text-left" onClick={() => setExpandedCat(isExpanded ? null : cat.id)}>
                  <span aria-hidden="true">{cat.icon}</span>
                  <span className="font-medium text-foreground">{cat.name}</span>
                  {subs.length > 0 && (isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <Plus className="h-3 w-3 text-muted-foreground" />)}
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">
                    <span className={over ? "text-destructive font-bold" : "text-foreground font-semibold"}>€{cat.spent.toFixed(2)}</span>
                    <span className="text-muted-foreground"> / €{cat.monthlyBudget.toFixed(2)}</span>
                  </span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSubCatParent(cat.id); setSubOpen(true); }} aria-label="Add sub-category">
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(cat)} aria-label="Edit">
                      <Settings2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCategory(cat.id)} aria-label="Delete">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <Progress
                value={pct}
                className="h-2"
                style={{
                  ["--progress-color" as string]: over ? "hsl(var(--destructive))" : pct > 70 ? "hsl(var(--warning))" : "hsl(var(--accent))"
                }}
              />
              {isExpanded && subs.length > 0 && (
                <div className="pl-6 space-y-1 pt-1">
                  {subs.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between text-xs py-1 group/sub">
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden="true">{sub.icon}</span>
                        <span className="text-foreground">{sub.name}</span>
                      </span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/sub:opacity-100" onClick={() => deleteSubCategory(cat.id, sub.id)}>
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Sub-category dialog */}
      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Sub-category</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Input
                value={subIcon}
                onChange={e => setSubIcon(e.target.value)}
                placeholder="Type or paste an emoji"
                className="text-2xl text-center h-12"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-name">Name</Label>
              <Input id="sub-name" value={subName} onChange={e => setSubName(e.target.value)} onKeyDown={handleSubKeyDown} placeholder="e.g., Rent, Utilities" />
            </div>
            <Button onClick={handleAddSub} className="w-full">Add Sub-category</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
