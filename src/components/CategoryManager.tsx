import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Settings2 } from "lucide-react";

const ICONS = ["🏠", "🍕", "🚗", "🎬", "💊", "🛍️", "📱", "✈️", "📚", "💡", "🏋️", "🎮", "👶", "🐕", "💰"];

export function CategoryManager() {
  const { data, addCategory, updateCategory, deleteCategory } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [budget, setBudget] = useState("");

  const resetForm = () => { setName(""); setIcon("📦"); setBudget(""); setEditId(null); };

  const handleSave = () => {
    if (!name || !budget) return;
    if (editId) {
      const existing = data.categories.find(c => c.id === editId);
      if (existing) updateCategory({ ...existing, name, icon, monthlyBudget: parseFloat(budget) });
    } else {
      addCategory({ name, icon, color: `hsl(var(--chart-${(data.categories.length % 6) + 1}))`, monthlyBudget: parseFloat(budget) });
    }
    setOpen(false);
    resetForm();
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

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Categories</h3>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Category</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(i => (
                    <button key={i} onClick={() => setIcon(i)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${icon === i ? "bg-accent/20 ring-2 ring-accent" : "bg-muted hover:bg-muted/80"}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Groceries" />
              </div>
              <div className="space-y-2">
                <Label>Monthly Budget (€)</Label>
                <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0.00" />
              </div>
              <Button onClick={handleSave} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {editId ? "Update" : "Create"} Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {data.categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 group">
            <div className="flex items-center gap-2">
              <span>{cat.icon}</span>
              <div>
                <p className="text-sm font-medium leading-tight">{cat.name}</p>
                <p className="text-xs text-muted-foreground font-mono">€{cat.monthlyBudget}</p>
              </div>
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(cat.id)}>
                <Settings2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCategory(cat.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
