import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function ExpenseList() {
  const { data, selectedMonth, getMonthExpenses, addExpense, updateExpense, deleteExpense } = useStore();
  const [filterCat, setFilterCat] = useState<string>("all");
  
  const allExpenses = getMonthExpenses(selectedMonth).sort((a, b) => b.date.localeCompare(a.date));
  const expenses = filterCat === "all" ? allExpenses : allExpenses.filter(e => e.categoryId === filterCat);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catId, setCatId] = useState("");
  const [subCatId, setSubCatId] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const resetForm = () => { setCatId(""); setSubCatId(""); setAmount(""); setDesc(""); setDate(new Date().toISOString().slice(0, 10)); setEditingId(null); };

  const handleSave = () => {
    if (!catId || !amount) return;
    const expenseData = { categoryId: catId, subCategoryId: subCatId || undefined, amount: parseFloat(amount), description: desc, date };
    if (editingId) {
      updateExpense({ ...expenseData, id: editingId });
    } else {
      addExpense(expenseData);
    }
    setOpen(false);
    resetForm();
  };

  const handleEdit = (id: string) => {
    const exp = data.expenses.find(e => e.id === id);
    if (!exp) return;
    setEditingId(id);
    setCatId(exp.categoryId);
    setSubCatId(exp.subCategoryId ?? "");
    setAmount(String(exp.amount));
    setDesc(exp.description);
    setDate(exp.date);
    setOpen(true);
  };

  const getCat = (id: string) => data.categories.find(c => c.id === id);
  const selectedCat = data.categories.find(c => c.id === catId);
  const subCategories = selectedCat?.subCategories ?? [];

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="section-title">Expenses</h3>
        <div className="flex items-center gap-2">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="h-8 text-xs w-[130px]" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {data.categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs" aria-label="Add expense">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Expense</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="exp-category">Category</Label>
                  <Select value={catId} onValueChange={(v) => { setCatId(v); setSubCatId(""); }}>
                    <SelectTrigger id="exp-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {data.categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {subCategories.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="exp-subcategory">Sub-category</Label>
                    <Select value={subCatId} onValueChange={setSubCatId}>
                      <SelectTrigger id="exp-subcategory"><SelectValue placeholder="(optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {subCategories.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="exp-amount">Amount (€)</Label>
                  <Input id="exp-amount" type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-desc">Description</Label>
                  <Input id="exp-desc" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was this for?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-date">Date</Label>
                  <Input id="exp-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <Button onClick={handleSave} className="w-full">{editingId ? "Update" : "Add"} Expense</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
        {expenses.map(e => {
          const cat = getCat(e.categoryId);
          const sub = cat?.subCategories?.find(s => s.id === e.subCategoryId);
          return (
            <div key={e.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/60 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0" aria-hidden="true">{cat?.icon ?? "📦"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.description || cat?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {sub && <span className="ml-1.5 text-muted-foreground">· {sub.icon} {sub.name}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="font-mono text-sm font-semibold text-destructive" aria-label={`minus ${e.amount.toFixed(2)} euros`}>
                  −€{e.amount.toFixed(2)}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(e.id)} aria-label="Edit expense">
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteExpense(e.id)} aria-label="Delete expense">
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            </div>
          );
        })}
        {expenses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {filterCat !== "all" ? "No expenses in this category." : "No expenses this month. Click \"Add\" to start tracking!"}
          </p>
        )}
      </div>
    </Card>
  );
}
