import { useState, useRef, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Sparkles, Loader2, FileText, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ParsedExpense {
  amount: number;
  description: string;
  date: string;
  categoryId: string | null;
  categoryGuess: string;
  _include?: boolean;
  _categoryId?: string;
}
interface ParsedIncome {
  amount: number;
  description: string;
  type: string;
  date: string;
  _include?: boolean;
}
interface Parsed {
  detectedSalary: number | null;
  statementMonth: string | null;
  incomes: ParsedIncome[];
  expenses: ParsedExpense[];
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      res(s.split(",")[1] ?? "");
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });

// Derive the statement month from the most common YYYY-MM in transaction dates
const deriveMonth = (p: Parsed): string | null => {
  const counts = new Map<string, number>();
  const collect = (d: string) => {
    const m = d?.slice(0, 7);
    if (m && /^\d{4}-\d{2}$/.test(m)) counts.set(m, (counts.get(m) ?? 0) + 1);
  };
  p.expenses?.forEach(e => collect(e.date));
  p.incomes?.forEach(i => collect(i.date));
  let best: string | null = null;
  let max = 0;
  counts.forEach((v, k) => { if (v > max) { max = v; best = k; } });
  return best;
};

export function BankStatementImport() {
  const { data, addExpense, addIncome, addCategory, setSalary, setSelectedMonth, selectedMonth } = useStore();
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [importSalary, setImportSalary] = useState(true);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📦");
  const [newCatTargetIdx, setNewCatTargetIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const effectiveMonth = useMemo(() => {
    if (!parsed) return null;
    return parsed.statementMonth ?? deriveMonth(parsed);
  }, [parsed]);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Please upload a PDF bank statement.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 10MB.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const pdfBase64 = await fileToBase64(file);
      const { data: result, error } = await supabase.functions.invoke("parse-bank-statement", {
        body: {
          pdfBase64,
          categories: data.categories.map(c => ({ id: c.id, name: c.name, icon: c.icon })),
        },
      });
      if (error) throw error;
      if ((result as any)?.error) throw new Error((result as any).error);
      const p = result as Parsed;
      p.expenses = (p.expenses ?? []).map(e => ({ ...e, _include: true, _categoryId: e.categoryId ?? "" }));
      p.incomes = (p.incomes ?? []).map(i => ({ ...i, _include: true }));
      // Fallback month detection from transaction dates
      if (!p.statementMonth) p.statementMonth = deriveMonth(p);
      setParsed(p);
      toast({ title: "Statement analyzed", description: `Found ${p.expenses.length} expenses and ${p.incomes.length} incomes.` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Could not read statement", description: e.message ?? "Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    if (!parsed) return;
    let added = 0;
    parsed.expenses.filter(e => e._include && e._categoryId).forEach(e => {
      addExpense({
        categoryId: e._categoryId!,
        amount: e.amount,
        description: e.description,
        date: new Date(e.date).toISOString(),
      });
      added++;
    });
    parsed.incomes.filter(i => i._include).forEach(i => {
      addIncome({
        amount: i.amount,
        description: i.description,
        type: i.type,
        date: new Date(i.date).toISOString(),
      });
      added++;
    });
    if (importSalary && parsed.detectedSalary && parsed.detectedSalary > 0 && effectiveMonth) {
      setSalary(effectiveMonth, parsed.detectedSalary);
    }
    if (effectiveMonth) setSelectedMonth(effectiveMonth);
    toast({ title: "Imported!", description: `${added} entries added${effectiveMonth ? ` to ${effectiveMonth}` : ""}.` });
    setParsed(null);
  };

  const openNewCategory = (idx: number) => {
    const guess = parsed?.expenses[idx]?.categoryGuess ?? "";
    setNewCatName(guess);
    setNewCatIcon("📦");
    setNewCatTargetIdx(idx);
    setNewCatOpen(true);
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    const id = crypto.randomUUID();
    addCategory({
      // addCategory ignores any provided id and creates its own — so we pre-create here
      name: newCatName.trim(),
      icon: newCatIcon || "📦",
      color: "hsl(var(--chart-1))",
      monthlyBudget: 0,
      subCategories: [],
    } as any);
    // Find the newly added category by name (most recent match)
    setTimeout(() => {
      const cat = [...data.categories].reverse().find(c => c.name === newCatName.trim());
      if (cat && parsed && newCatTargetIdx != null) {
        const n = { ...parsed };
        n.expenses[newCatTargetIdx]._categoryId = cat.id;
        setParsed({ ...n });
      }
    }, 0);
    setNewCatOpen(false);
  };

  const skipped = parsed?.expenses.filter(e => e._include && !e._categoryId).length ?? 0;

  return (
    <>
      <Card className="glass-card p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Import bank statement</h3>
              <p className="text-xs text-muted-foreground">Upload your monthly PDF — Mony will read and sort it for you.</p>
            </div>
          </div>
          <Button onClick={() => fileRef.current?.click()} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? "Analyzing…" : "Upload PDF"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      </Card>

      <Dialog open={!!parsed} onOpenChange={o => !o && setParsed(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Review extracted entries
            </DialogTitle>
          </DialogHeader>

          {parsed && (
            <div className="space-y-5">
              <div className="text-xs text-muted-foreground">
                Statement month: <span className="font-mono font-semibold text-foreground">{effectiveMonth ?? "unknown"}</span>
              </div>
              {parsed.detectedSalary != null && parsed.detectedSalary > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={importSalary} onCheckedChange={v => setImportSalary(!!v)} />
                    Set salary for {effectiveMonth ?? selectedMonth} to
                    <span className="font-mono font-semibold">€{parsed.detectedSalary.toFixed(2)}</span>
                  </label>
                </div>
              )}

              {parsed.incomes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-success">Incomes ({parsed.incomes.filter(i => i._include).length})</h4>
                  <div className="space-y-1.5">
                    {parsed.incomes.map((i, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-md border border-border">
                        <Checkbox
                          checked={!!i._include}
                          onCheckedChange={v => {
                            const n = { ...parsed };
                            n.incomes[idx]._include = !!v;
                            setParsed({ ...n });
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{i.description}</div>
                          <div className="text-xs text-muted-foreground">{i.date} · {i.type}</div>
                        </div>
                        <span className="font-mono text-sm font-semibold text-success">€{i.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsed.expenses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-destructive">Expenses ({parsed.expenses.filter(e => e._include).length})</h4>
                  <div className="space-y-1.5">
                    {parsed.expenses.map((e, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-md border border-border">
                        <Checkbox
                          checked={!!e._include}
                          onCheckedChange={v => {
                            const n = { ...parsed };
                            n.expenses[idx]._include = !!v;
                            setParsed({ ...n });
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{e.description}</div>
                          <div className="text-xs text-muted-foreground">{e.date} · suggested: {e.categoryGuess}</div>
                        </div>
                        <Select
                          value={e._categoryId || ""}
                          onValueChange={v => {
                            if (v === "__new__") { openNewCategory(idx); return; }
                            const n = { ...parsed };
                            n.expenses[idx]._categoryId = v;
                            setParsed({ ...n });
                          }}
                        >
                          <SelectTrigger className="w-44 h-8 text-xs">
                            <SelectValue placeholder="Pick category" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.categories.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                            ))}
                            <SelectItem value="__new__">
                              <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> New category…</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="font-mono text-sm font-semibold text-destructive w-20 text-right">€{e.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {skipped > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {skipped} expense(s) have no category and will be skipped.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setParsed(null)}>Cancel</Button>
            <Button onClick={handleConfirm}>Import selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Subscriptions" />
            </div>
            <div>
              <Label>Icon (emoji)</Label>
              <Input value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} maxLength={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewCatOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCategory} disabled={!newCatName.trim()}>Create & assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
