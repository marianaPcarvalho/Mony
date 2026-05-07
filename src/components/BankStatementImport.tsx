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
import { Upload, Sparkles, Loader2, FileText, Plus, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ParsedExpense {
  amount: number;
  description: string;
  date: string;
  categoryId: string | null;
  categoryGuess: string;
  _include?: boolean;
  _categoryId?: string;
  _subCategoryId?: string;
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

const MEMORY_KEY = "bank-import-memory-v1";
const META_KEY = "bank-import-meta-v1";
const REMINDER_KEY = "bank-import-reminder-v1";

interface MemoryEntry {
  categoryId: string;
  subCategoryId?: string;
  incomeType?: string;
}
type Memory = Record<string, MemoryEntry>; // key = normalized description

interface ImportMeta {
  lastFileName?: string;
  lastImportedAt?: string;
}

const normalizeDesc = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .replace(/\d{4,}/g, "") // strip long numbers (card endings, refs)
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .slice(0, 60);

const loadMemory = (): Memory => {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) ?? "{}"); } catch { return {}; }
};
const saveMemory = (m: Memory) => localStorage.setItem(MEMORY_KEY, JSON.stringify(m));

const loadMeta = (): ImportMeta => {
  try { return JSON.parse(localStorage.getItem(META_KEY) ?? "{}"); } catch { return {}; }
};
const saveMeta = (m: ImportMeta) => localStorage.setItem(META_KEY, JSON.stringify(m));

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
  const [pendingAssign, setPendingAssign] = useState<{ name: string; idx: number | "bulk" } | null>(null);
  const [meta, setMeta] = useState<ImportMeta>(loadMeta);

  // Bulk-edit
  const [bulkSel, setBulkSel] = useState<Set<number>>(new Set());
  const [bulkIncSel, setBulkIncSel] = useState<Set<number>>(new Set());
  const [bulkCat, setBulkCat] = useState<string>("");
  const [bulkSub, setBulkSub] = useState<string>("");
  const [bulkIncType, setBulkIncType] = useState<string>("");

  const fileRef = useRef<HTMLInputElement>(null);

  // New-month reminder: toast once per month change (based on last seen month).
  useEffect(() => {
    try {
      const now = new Date();
      const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const last = localStorage.getItem(REMINDER_KEY);
      if (last && last !== cur) {
        toast({
          title: "New month started 📅",
          description: `Don't forget to import your bank statement for ${last}.`,
        });
      }
      localStorage.setItem(REMINDER_KEY, cur);
    } catch { /* ignore */ }
  }, []);

  // Re-assign newly created category to the right row(s)
  useEffect(() => {
    if (!pendingAssign || !parsed) return;
    const cat = data.categories.find(c => c.name === pendingAssign.name);
    if (!cat) return;
    const n = { ...parsed };
    if (pendingAssign.idx === "bulk") {
      bulkSel.forEach(i => { n.expenses[i]._categoryId = cat.id; n.expenses[i]._subCategoryId = ""; });
      setBulkCat(cat.id);
      setBulkSub("");
    } else {
      n.expenses[pendingAssign.idx]._categoryId = cat.id;
      n.expenses[pendingAssign.idx]._subCategoryId = "";
    }
    setParsed({ ...n });
    setPendingAssign(null);
  }, [data.categories, pendingAssign, parsed, bulkSel]);

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
      const memory = loadMemory();

      p.expenses = (p.expenses ?? []).map(e => {
        const learned = memory[normalizeDesc(e.description)];
        // If we've seen this description before, prefer the learned category.
        const catId = learned?.categoryId ?? e.categoryId ?? "";
        return {
          ...e,
          _include: true,
          _categoryId: catId,
          _subCategoryId: learned?.subCategoryId ?? "",
        };
      });
      p.incomes = (p.incomes ?? []).map(i => {
        const learned = memory[normalizeDesc(i.description)];
        return { ...i, _include: true, type: learned?.incomeType ?? i.type };
      });

      if (!p.statementMonth) p.statementMonth = deriveMonth(p);
      setParsed(p);
      setBulkSel(new Set());
      setBulkIncSel(new Set());
      setBulkCat("");
      setBulkSub("");
      setBulkIncType("");

      const newMeta = { lastFileName: file.name, lastImportedAt: new Date().toISOString() };
      setMeta(newMeta);
      saveMeta(newMeta);

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
    const memory = loadMemory();
    let added = 0;

    parsed.expenses.filter(e => e._include && e._categoryId).forEach(e => {
      addExpense({
        categoryId: e._categoryId!,
        subCategoryId: e._subCategoryId || undefined,
        amount: e.amount,
        description: e.description,
        date: new Date(e.date).toISOString(),
      });
      // remember mapping
      const k = normalizeDesc(e.description);
      if (k) memory[k] = { categoryId: e._categoryId!, subCategoryId: e._subCategoryId || undefined };
      added++;
    });
    parsed.incomes.filter(i => i._include).forEach(i => {
      addIncome({
        amount: i.amount,
        description: i.description,
        type: i.type,
        date: new Date(i.date).toISOString(),
      });
      const k = normalizeDesc(i.description);
      if (k) memory[k] = { ...(memory[k] ?? { categoryId: "" }), incomeType: i.type };
      added++;
    });

    saveMemory(memory);

    if (importSalary && parsed.detectedSalary && parsed.detectedSalary > 0 && effectiveMonth) {
      setSalary(effectiveMonth, parsed.detectedSalary);
    }
    if (effectiveMonth) setSelectedMonth(effectiveMonth);
    toast({ title: "Imported!", description: `${added} entries added${effectiveMonth ? ` to ${effectiveMonth}` : ""}.` });
    setParsed(null);
  };

  const openNewCategory = (idx: number | "bulk") => {
    const guess = idx === "bulk" ? "" : (parsed?.expenses[idx]?.categoryGuess ?? "");
    setNewCatName(guess);
    setNewCatIcon("📦");
    setNewCatTargetIdx(idx as any);
    setNewCatOpen(true);
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim() || newCatTargetIdx == null) return;
    const name = newCatName.trim();
    addCategory({
      name,
      icon: newCatIcon || "📦",
      color: "hsl(var(--chart-1))",
      monthlyBudget: 0,
      subCategories: [],
    });
    setPendingAssign({ name, idx: newCatTargetIdx as any });
    setNewCatOpen(false);
  };

  // Apply bulk category/sub to all selected expense rows
  const applyBulkExpense = () => {
    if (!parsed || bulkSel.size === 0 || !bulkCat) return;
    const n = { ...parsed };
    bulkSel.forEach(i => {
      n.expenses[i]._categoryId = bulkCat;
      n.expenses[i]._subCategoryId = bulkSub || "";
    });
    setParsed({ ...n });
    toast({ title: `Applied to ${bulkSel.size} expense(s)` });
  };

  const applyBulkIncome = () => {
    if (!parsed || bulkIncSel.size === 0 || !bulkIncType) return;
    const n = { ...parsed };
    bulkIncSel.forEach(i => { n.incomes[i].type = bulkIncType; });
    setParsed({ ...n });
    toast({ title: `Applied to ${bulkIncSel.size} income(s)` });
  };

  const toggleAllExpenses = (checked: boolean) => {
    if (!parsed) return;
    if (checked) setBulkSel(new Set(parsed.expenses.map((_, i) => i)));
    else setBulkSel(new Set());
  };
  const toggleAllIncomes = (checked: boolean) => {
    if (!parsed) return;
    if (checked) setBulkIncSel(new Set(parsed.incomes.map((_, i) => i)));
    else setBulkIncSel(new Set());
  };

  const skipped = parsed?.expenses.filter(e => e._include && !e._categoryId).length ?? 0;
  const bulkCatObj = data.categories.find(c => c.id === bulkCat);
  const bulkSubs = bulkCatObj?.subCategories ?? [];

  return (
    <>
      <Card className="glass-card p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">Import bank statement</h3>
              <p className="text-xs text-muted-foreground">Upload your monthly PDF — Mony will read and sort it for you.</p>
              {meta.lastFileName && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  Last import: <span className="font-medium text-foreground">{meta.lastFileName}</span>
                  {meta.lastImportedAt && <> · {new Date(meta.lastImportedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => fileRef.current?.click()} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : meta.lastFileName ? <RefreshCw className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {loading ? "Analyzing…" : meta.lastFileName ? "Re-import PDF" : "Upload PDF"}
            </Button>
          </div>
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
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm text-success">
                      Incomes ({parsed.incomes.filter(i => i._include).length})
                    </h4>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox
                        checked={bulkIncSel.size === parsed.incomes.length && parsed.incomes.length > 0}
                        onCheckedChange={v => toggleAllIncomes(!!v)}
                      />
                      Select all
                    </label>
                  </div>

                  {bulkIncSel.size > 0 && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-md bg-muted/40 border border-border flex-wrap">
                      <span className="text-xs text-muted-foreground">{bulkIncSel.size} selected →</span>
                      <Input
                        value={bulkIncType}
                        onChange={e => setBulkIncType(e.target.value)}
                        placeholder="Type (salary, refund, …)"
                        className="h-8 text-xs w-44"
                      />
                      <Button size="sm" className="h-8" onClick={applyBulkIncome} disabled={!bulkIncType}>Apply</Button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {parsed.incomes.map((i, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-md border border-border">
                        <Checkbox
                          checked={bulkIncSel.has(idx)}
                          onCheckedChange={v => {
                            const s = new Set(bulkIncSel);
                            if (v) s.add(idx); else s.delete(idx);
                            setBulkIncSel(s);
                          }}
                          aria-label="Select for bulk edit"
                        />
                        <Checkbox
                          checked={!!i._include}
                          onCheckedChange={v => {
                            const n = { ...parsed };
                            n.incomes[idx]._include = !!v;
                            setParsed({ ...n });
                          }}
                          aria-label="Include in import"
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
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm text-destructive">
                      Expenses ({parsed.expenses.filter(e => e._include).length})
                    </h4>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox
                        checked={bulkSel.size === parsed.expenses.length && parsed.expenses.length > 0}
                        onCheckedChange={v => toggleAllExpenses(!!v)}
                      />
                      Select all
                    </label>
                  </div>

                  {bulkSel.size > 0 && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-md bg-muted/40 border border-border flex-wrap">
                      <span className="text-xs text-muted-foreground">{bulkSel.size} selected →</span>
                      <Select
                        value={bulkCat}
                        onValueChange={v => {
                          if (v === "__new__") { openNewCategory("bulk"); return; }
                          setBulkCat(v); setBulkSub("");
                        }}
                      >
                        <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          {data.categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                          ))}
                          <SelectItem value="__new__">
                            <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> New category…</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {bulkSubs.length > 0 && (
                        <Select value={bulkSub || "none"} onValueChange={v => setBulkSub(v === "none" ? "" : v)}>
                          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Sub-category" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {bulkSubs.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button size="sm" className="h-8" onClick={applyBulkExpense} disabled={!bulkCat}>Apply</Button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {parsed.expenses.map((e, idx) => {
                      const cat = data.categories.find(c => c.id === e._categoryId);
                      const subs = cat?.subCategories ?? [];
                      return (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-md border border-border">
                          <Checkbox
                            checked={bulkSel.has(idx)}
                            onCheckedChange={v => {
                              const s = new Set(bulkSel);
                              if (v) s.add(idx); else s.delete(idx);
                              setBulkSel(s);
                            }}
                            aria-label="Select for bulk edit"
                          />
                          <Checkbox
                            checked={!!e._include}
                            onCheckedChange={v => {
                              const n = { ...parsed };
                              n.expenses[idx]._include = !!v;
                              setParsed({ ...n });
                            }}
                            aria-label="Include in import"
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
                              n.expenses[idx]._subCategoryId = "";
                              setParsed({ ...n });
                            }}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
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
                          {subs.length > 0 && (
                            <Select
                              value={e._subCategoryId || "none"}
                              onValueChange={v => {
                                const n = { ...parsed };
                                n.expenses[idx]._subCategoryId = v === "none" ? "" : v;
                                setParsed({ ...n });
                              }}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder="Sub" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {subs.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <span className="font-mono text-sm font-semibold text-destructive w-20 text-right">€{e.amount.toFixed(2)}</span>
                        </div>
                      );
                    })}
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
