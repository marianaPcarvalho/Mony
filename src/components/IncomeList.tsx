import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, TrendingUp } from "lucide-react";

const INCOME_TYPES = [
  { value: "salary", label: "💼 Salary" },
  { value: "freelance", label: "💻 Freelance" },
  { value: "bonus", label: "🎁 Bonus" },
  { value: "investment", label: "📈 Investment Return" },
  { value: "gift", label: "🎀 Gift" },
  { value: "other", label: "📦 Other" },
];

export function IncomeList() {
  const { data, selectedMonth, addIncome, updateIncome, deleteIncome } = useStore();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("salary");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const monthIncomes = (data.incomes ?? []).filter((i) => i.date.startsWith(selectedMonth));
  const totalIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setType("salary");
    setDate(new Date().toISOString().slice(0, 10));
    setEditingId(null);
  };

  const handleSave = () => {
    if (!amount) return;
    const entry = { amount: parseFloat(amount), description, type, date };
    if (editingId) {
      updateIncome({ ...entry, id: editingId });
    } else {
      addIncome(entry);
    }
    setOpen(false);
    resetForm();
  };

  const handleEdit = (id: string) => {
    const inc = data.incomes?.find((i) => i.id === id);
    if (!inc) return;
    setEditingId(id);
    setAmount(String(inc.amount));
    setDescription(inc.description);
    setType(inc.type);
    setDate(inc.date);
    setOpen(true);
  };

  const fmt = (v: number) =>
    `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      <Card className="p-5 flex items-center justify-between glass-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-teal-500/15 flex items-center justify-center text-teal-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Income</div>
            <div className="text-xl font-bold text-foreground">+{fmt(totalIncome)}</div>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="h-4 w-4" /> Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-background border border-border shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingId ? "Edit" : "Add"} Income
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="incomeType">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v)}>
                  <SelectTrigger id="incomeType" className="bg-background border-input">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="incomeAmount">Amount (€)</Label>
                <Input
                  id="incomeAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="bg-background border-input"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="incomeDesc">Description — optional</Label>
                <Input
                  id="incomeDesc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., November salary, Client project"
                  className="bg-background border-input"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="incomeDate">Date</Label>
                <Input
                  id="incomeDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-background border-input"
                />
              </div>

              <Button onClick={handleSave} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                {editingId ? "Update" : "Add"} Income
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>

      <div className="space-y-3">
        {monthIncomes.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground glass-card">
            No income entries this month. Add your first one above!
          </Card>
        )}
        {monthIncomes.map((inc) => {
          const typeLabel = INCOME_TYPES.find((t) => t.value === inc.type)?.label ?? "📦 Other";
          return (
            <Card key={inc.id} className="p-4 flex items-center justify-between gap-4 glass-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-teal-500/15 flex items-center justify-center text-lg shrink-0">
                  {typeLabel.split(" ")[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {inc.description || typeLabel.split(" ").slice(1).join(" ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(inc.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  +{fmt(inc.amount)}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(inc.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => deleteIncome(inc.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
