import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function IncomeList() {
  const { data, selectedMonth, addIncome, updateIncome, deleteIncome } = useStore();
  const incomeCategories = data.incomeCategories ?? [];
  const fallbackType = incomeCategories[0]?.id ?? "other";

  const [filterType, setFilterType] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState(fallbackType);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState<string>("");

  const allIncomes = (data.incomes ?? [])
    .filter(i => i.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));
  const incomes = filterType === "all" ? allIncomes : allIncomes.filter(i => i.type === filterType);
  const pendingDelete = deleteId ? (data.incomes ?? []).find(i => i.id === deleteId) : null;

  const resetForm = () => { setType(fallbackType); setAmount(""); setDesc(""); setDate(""); setEditingId(null); };

  const amountNum = parseFloat(amount);
  const isValid = !!type && !!date && !isNaN(amountNum) && amountNum > 0;

  const handleSave = () => {
    if (!isValid) return;
    const payload = { amount: amountNum, description: desc, type, date };
    if (editingId) updateIncome({ ...payload, id: editingId });
    else addIncome(payload);
    setOpen(false);
    resetForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  const handleEdit = (id: string) => {
    const inc = (data.incomes ?? []).find(i => i.id === id);
    if (!inc) return;
    setEditingId(id);
    setType(inc.type);
    setAmount(String(inc.amount));
    setDesc(inc.description);
    setDate(inc.date);
    setOpen(true);
  };

  const getType = (v: string) => INCOME_TYPES.find(t => t.value === v) ?? INCOME_TYPES[INCOME_TYPES.length - 1];

  const visibleIncomes = expanded ? incomes : incomes.slice(0, 5);

  return (
    <Card className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="section-title flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" /> Income
        </h3>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 text-xs w-[130px]" aria-label="Filter by type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {INCOME_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2 h-11 text-sm font-semibold" aria-label="Add income">
            <Plus className="h-4 w-4" /> Add Income
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Income</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="inc-type">Type <span className="text-destructive">*</span></Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="inc-type" className="h-9"><SelectValue placeholder="Choose a type" /></SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inc-desc">Description</Label>
                <Input id="inc-desc" className="h-9" value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g. November salary" maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inc-amount">Amount <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                  <Input
                    id="inc-amount"
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
          <Button onClick={handleSave} disabled={!isValid} className="w-full mt-2">{editingId ? "Update" : "Add"} Income</Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-1">
        {visibleIncomes.map(i => {
          const t = getType(i.type);
          return (
            <div key={i.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/60 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0" aria-hidden="true">{t.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{i.description || t.label}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <span>{new Date(i.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-[10px] font-medium">
                      {t.label}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="font-mono text-sm font-bold text-teal-600 dark:text-teal-400" aria-label={`plus ${i.amount.toFixed(2)} euros`}>
                  +€{i.amount.toFixed(2)}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(i.id)} aria-label="Edit income">
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(i.id)} aria-label="Delete income">
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            </div>
          );
        })}
        {incomes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {filterType !== "all" ? "No income of this type." : "No income this month. Add your first entry above!"}
          </p>
        )}
      </div>

      {incomes.length > 5 && (
        <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show all {incomes.length} entries</>}
        </Button>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this income?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? (
                <>This will permanently remove <strong>{pendingDelete.description || getType(pendingDelete.type).label}</strong> (€{pendingDelete.amount.toFixed(2)}). This action cannot be undone.</>
              ) : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) deleteIncome(deleteId); setDeleteId(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
