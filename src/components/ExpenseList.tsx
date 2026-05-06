import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, Receipt, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ExpenseList() {
  const { data, selectedMonth, getMonthExpenses, addExpense, updateExpense, deleteExpense } = useStore();
  const [filterCat, setFilterCat] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);

  const allExpenses = getMonthExpenses(selectedMonth).sort((a, b) => b.date.localeCompare(a.date));
  const expenses = filterCat === "all" ? allExpenses : allExpenses.filter(e => e.categoryId === filterCat);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catId, setCatId] = useState("");
  const [subCatId, setSubCatId] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState<string>("");

  const resetForm = () => { setCatId(""); setSubCatId(""); setAmount(""); setDesc(""); setDate(""); setEditingId(null); };

  const amountNum = parseFloat(amount);
  const isValid = !!catId && !!date && !isNaN(amountNum) && amountNum > 0;

  const handleSave = () => {
    if (!isValid) return;
    const expenseData = { categoryId: catId, subCategoryId: subCatId || undefined, amount: amountNum, description: desc, date };
    if (editingId) {
      updateExpense({ ...expenseData, id: editingId });
    } else {
      addExpense(expenseData);
    }
    setOpen(false);
    resetForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
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

  const visibleExpenses = expanded ? expenses : expenses.slice(0, 5);

  return (
    <Card className="glass-card p-5 space-y-4">
      {/* Primary Add Expense Button */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="section-title flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" /> Expenses
        </h3>
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
        </div>
      </div>

      {/* Primary action - Add Expense */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2 h-11 text-sm font-semibold" aria-label="Add expense">
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Expense</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Left: category, description, amount */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="exp-category">Category <span className="text-destructive">*</span></Label>
                <Select value={catId} onValueChange={(v) => { setCatId(v); setSubCatId(""); }}>
                  <SelectTrigger id="exp-category" className="h-9"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                  <SelectContent>
                    {data.categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {subCategories.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="exp-subcategory">Sub-category</Label>
                  <Select value={subCatId || "none"} onValueChange={(v) => setSubCatId(v === "none" ? "" : v)}>
                    <SelectTrigger id="exp-subcategory" className="h-9"><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {subCategories.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="exp-desc">Description</Label>
                <Input id="exp-desc" className="h-9" value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g. Groceries at Continente" maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exp-amount">Amount <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                  <Input
                    id="exp-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onBlur={() => {
                      const n = parseFloat(amount);
                      if (!isNaN(n)) setAmount(n.toFixed(2));
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="0.00"
                    className="pl-7 h-9 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Right: calendar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Date <span className="text-destructive">*</span></Label>
                <span className="text-xs text-muted-foreground">
                  {date ? format(parseISO(date), "PPP") : "Pick a day"}
                </span>
              </div>
              <div className="rounded-md border border-border flex justify-center">
                <Calendar
                  mode="single"
                  selected={date ? parseISO(date) : undefined}
                  onSelect={(d) => d && setDate(format(d, "yyyy-MM-dd"))}
                  className={cn("p-2 pointer-events-auto")}
                />
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!isValid} className="w-full mt-2">{editingId ? "Update" : "Add"} Expense</Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-1">
        {visibleExpenses.map(e => {
          const cat = getCat(e.categoryId);
          const sub = cat?.subCategories?.find(s => s.id === e.subCategoryId);
          return (
            <div key={e.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/60 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0" aria-hidden="true">{cat?.icon ?? "📦"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{e.description || cat?.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <span>{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {sub && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium"
                        style={{
                          background: `${sub.color ?? "hsl(220, 70%, 55%)"}1A`,
                          borderColor: `${sub.color ?? "hsl(220, 70%, 55%)"}66`,
                          color: sub.color ?? "hsl(220, 70%, 55%)",
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: sub.color ?? "hsl(220, 70%, 55%)" }} aria-hidden="true" />
                        {sub.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="font-mono text-sm font-bold text-destructive" aria-label={`minus ${e.amount.toFixed(2)} euros`}>
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
          <p className="text-sm text-muted-foreground text-center py-6">
            {filterCat !== "all" ? "No expenses in this category." : "No expenses this month. Add your first expense above!"}
          </p>
        )}
      </div>

      {expenses.length > 5 && (
        <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show all {expenses.length} expenses</>}
        </Button>
      )}
    </Card>
  );
}
