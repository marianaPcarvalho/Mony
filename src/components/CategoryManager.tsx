import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Settings2, ChevronDown, ChevronRight } from "lucide-react";

export function CategoryManager() {
  const { data, addCategory, updateCategory, deleteCategory, addSubCategory, deleteSubCategory } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [budget, setBudget] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [subOpen, setSubOpen] = useState(false);
  const [subName, setSubName] = useState("");
  const [subIcon, setSubIcon] = useState("📦");
  const [subCatParent, setSubCatParent] = useState("");

  const resetForm = () => { setName(""); setIcon("📦"); setBudget(""); setRecurring(false); setEditId(null); };

  const handleSave = () => {
    if (!name || !budget) return;
    if (editId) {
      const existing = data.categories.find(c => c.id === editId);
      if (existing) updateCategory({ ...existing, name, icon, monthlyBudget: parseFloat(budget), recurring });
    } else {
      addCategory({ name, icon, color: `hsl(var(--chart-${(data.categories.length % 6) + 1}))`, monthlyBudget: parseFloat(budget), subCategories: [], recurring });
    }
    setOpen(false);
    resetForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  const handleEdit = (id: string) => {
    const cat = data.categories.find(c => c.id === id);
    if (!cat) return;
    setEditId(id);
    setName(cat.name);
    setIcon(cat.icon);
    setBudget(String(cat.monthlyBudget));
    setOpen(true);
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
        <h3 className="section-title">Categories</h3>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs" aria-label="Add new category">
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Category</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  placeholder="Type or paste an emoji"
                  className="text-2xl text-center h-12"
                  maxLength={2}
                />
                <p className="text-[10px] text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 rounded bg-muted text-foreground text-[10px]">⌘</kbd> + <kbd className="px-1 py-0.5 rounded bg-muted text-foreground text-[10px]">⌃</kbd> + <kbd className="px-1 py-0.5 rounded bg-muted text-foreground text-[10px]">Space</kbd> (Mac) or <kbd className="px-1 py-0.5 rounded bg-muted text-foreground text-[10px]">Win</kbd> + <kbd className="px-1 py-0.5 rounded bg-muted text-foreground text-[10px]">.</kbd> (Windows) to open emoji picker
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input id="cat-name" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., Groceries" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-budget">Monthly Budget (€)</Label>
                <Input id="cat-budget" type="number" min="0" step="0.01" inputMode="decimal" value={budget} onChange={e => setBudget(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" />
              </div>
              <Button onClick={handleSave} className="w-full">{editId ? "Update" : "Create"} Category</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {data.categories.map(cat => {
          const isExpanded = expandedCat === cat.id;
          const subs = cat.subCategories ?? [];
          return (
            <div key={cat.id} className="rounded-lg border border-border/50 overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/30 group">
                <button className="flex items-center gap-2.5 text-left flex-1" onClick={() => setExpandedCat(isExpanded ? null : cat.id)} aria-expanded={isExpanded}>
                  {subs.length > 0 ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />) : <span className="w-3.5" />}
                  <span className="text-lg" aria-hidden="true">{cat.icon}</span>
                  <div>
                    <p className="text-sm font-medium leading-tight text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">€{cat.monthlyBudget.toFixed(2)}/mo</p>
                  </div>
                </button>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSubCatParent(cat.id); setSubOpen(true); }} aria-label={`Add sub-category to ${cat.name}`}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(cat.id)} aria-label={`Edit ${cat.name}`}>
                    <Settings2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCategory(cat.id)} aria-label={`Delete ${cat.name}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {isExpanded && subs.length > 0 && (
                <div className="px-3 py-2 space-y-1 bg-muted/10">
                  {subs.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors group/sub">
                      <div className="flex items-center gap-2">
                        <span className="text-sm" aria-hidden="true">{sub.icon}</span>
                        <span className="text-sm text-foreground">{sub.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/sub:opacity-100" onClick={() => deleteSubCategory(cat.id, sub.id)} aria-label={`Delete ${sub.name}`}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {isExpanded && subs.length === 0 && (
                <div className="px-3 py-3 bg-muted/10">
                  <p className="text-xs text-muted-foreground text-center">No sub-categories yet.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
              <p className="text-[10px] text-muted-foreground">
                Use your system emoji picker to choose an icon
              </p>
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
