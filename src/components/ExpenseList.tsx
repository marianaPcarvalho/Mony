import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function ExpenseList() {
  const { data, selectedMonth, getMonthExpenses, addExpense, deleteExpense } = useStore();
  const expenses = getMonthExpenses(selectedMonth).sort((a, b) => b.date.localeCompare(a.date));

  const [open, setOpen] = useState(false);
  const [catId, setCatId] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAdd = () => {
    if (!catId || !amount) return;
    addExpense({ categoryId: catId, amount: parseFloat(amount), description: desc, date });
    setOpen(false);
    setAmount("");
    setDesc("");
    setCatId("");
  };

  const getCat = (id: string) => data.categories.find(c => c.id === id);

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Recent Expenses</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={catId} onValueChange={setCatId}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {data.categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (€)</Label>
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was this for?" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <Button onClick={handleAdd} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Add Expense</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {expenses.map(e => {
          const cat = getCat(e.categoryId);
          return (
            <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-lg">{cat?.icon ?? "📦"}</span>
                <div>
                  <p className="text-sm font-medium">{e.description || cat?.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-destructive">-€{e.amount.toFixed(2)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteExpense(e.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          );
        })}
        {expenses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No expenses this month. Click "Add" to start tracking!</p>
        )}
      </div>
    </Card>
  );
}
