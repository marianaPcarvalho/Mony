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
import { Upload, Sparkles, Loader2, FileText, Plus, RefreshCw, AlertTriangle, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EmojiPickerButton } from "./EmojiPickerButton";

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
const META_KEY = "bank-import-meta-v2"; // v2: per-month tracking

interface MemoryEntry {
  categoryId: string;
  subCategoryId?: string;
  incomeType?: string;
}
type Memory = Record<string, MemoryEntry>;

interface ImportMeta {
  lastFileName?: string;
  lastImportedAt?: string;
  byMonth?: Record<string, { fileName: string; importedAt: string }>;
}

const normalizeDesc = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .replace(/\d{4,}/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .slice(0, 60);

const dedupeKey = (description: string, amount: number, monthOrDate: string) =>
  `${normalizeDesc(description)}|${amount.toFixed(2)}|${monthOrDate.slice(0, 7)}`;

const loadMemory = (): Memory => {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) ?? "{}"); } catch { return {}; }
};
const saveMemory = (m: Memory) => localStorage.setItem(MEMORY_KEY, JSON.stringify(m));

const loadMeta = (): ImportMeta => {
  try { return JSON.parse(localStorage.getItem(META_KEY) ?? "{}"); } catch { return {}; }
};
const saveMeta = (m: ImportMeta) => localStorage.setItem(META_KEY, JSON.stringify(m));

export const hasAnyImport = () => {
  const m = loadMeta();
  return !!(m.lastFileName || (m.byMonth && Object.keys(m.byMonth).length > 0));
};

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

interface Props {
  variant?: "full" | "compact";
}

export function BankStatementImport({ variant = "full" }: Props) {
  const {
    data, addExpense, addIncome, deleteExpense, deleteIncome,
    addCategory, setSalary, setSelectedMonth, selectedMonth,
  } = useStore();
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [importSalary, setImportSalary] = useState(true);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📦");
  const [newCatTargetIdx, setNewCatTargetIdx] = useState<number | null>(null);
  const [pendingAssign, setPendingAssign] = useState<{ name: string; idx: number | "bulk" } | null>(null);
  const [meta, setMeta] = useState<ImportMeta>(loadMeta);

  const [bulkSel, setBulkSel] = useState<Set<number>>(new Set());
  const [bulkIncSel, setBulkIncSel] = useState<Set<number>>(new Set());
  const [bulkCat, setBulkCat] = useState<string>("");
  const [bulkSub, setBulkSub] = useState<string>("");
  const [bulkIncType, setBulkIncType] = useState<string>("");

  const fileRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const curMonthLabel = now.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  const curMonthImport = meta.byMonth?.[curMonthKey];
  const curMonthHasImport = !!curMonthImport;

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

  const monthAlreadyImported = effectiveMonth ? !!meta.byMonth?.[effectiveMonth] : false;

  const handleFile = async (file: File) => {
    if (!file) {
      toast({ title: "Nenhum ficheiro selecionado", variant: "destructive" });
      return;
    }
    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf && !isSvg) {
      toast({ title: "Formato não suportado", description: "Carrega um extrato em PDF ou SVG.", variant: "destructive" });
      return;
    }
    if (file.size === 0) {
      toast({ title: "Ficheiro vazio", description: "O ficheiro selecionado parece estar vazio.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Ficheiro demasiado grande", description: "Tamanho máximo: 10MB.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        categories: data.categories.map(c => ({ id: c.id, name: c.name, icon: c.icon })),
      };
      if (isSvg) {
        const svgContent = await file.text().catch(() => {
          throw new Error("Não foi possível ler o SVG.");
        });
        if (!svgContent.trim()) throw new Error("O SVG parece estar vazio.");
        body.svgContent = svgContent;
      } else {
        const pdfBase64 = await fileToBase64(file).catch(() => {
          throw new Error("Não foi possível ler o ficheiro. Guarda o PDF novamente e tenta outra vez.");
        });
        if (!pdfBase64) throw new Error("O ficheiro parece estar vazio.");
        body.pdfBase64 = pdfBase64;
      }

      const { data: result, error } = await supabase.functions.invoke("parse-bank-statement", {
        body,
      });
      if (error) {
        const msg = (error as any)?.message ?? "";
        if (msg.includes("429")) throw new Error("Demasiados pedidos. Aguarda um momento e tenta novamente.");
        if (msg.includes("402")) throw new Error("Créditos de IA esgotados. Adiciona créditos para continuar.");
        throw new Error(msg || "Erro do servidor ao ler o extrato.");
      }
      if ((result as any)?.error) throw new Error((result as any).error);
      const p = result as Parsed;
      if (!p || (!p.expenses?.length && !p.incomes?.length)) {
        throw new Error("Sem transações neste PDF. Confirma que é um extrato com lista de movimentos.");
      }

      const memory = loadMemory();
      p.expenses = (p.expenses ?? []).map(e => {
        const learned = memory[normalizeDesc(e.description)];
        const catId = learned?.categoryId ?? e.categoryId ?? "";
        return { ...e, _include: true, _categoryId: catId, _subCategoryId: learned?.subCategoryId ?? "" };
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

      toast({ title: "Extrato analisado", description: `Encontradas ${p.expenses.length} despesas e ${p.incomes.length} receitas.` });
    } catch (e: any) {
      console.error("Bank statement upload failed:", e);
      toast({
        title: "Não foi possível ler o extrato",
        description: e?.message ?? "Algo correu mal. Tenta novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    if (!parsed) return;
    const memory = loadMemory();
    let added = 0;

    // Build dedup index of existing entries (by month + key)
    const existingExpenseByKey = new Map<string, string>(); // key -> id
    data.expenses.forEach(x => {
      existingExpenseByKey.set(dedupeKey(x.description, x.amount, x.date), x.id);
    });
    const existingIncomeByKey = new Map<string, string>();
    (data.incomes ?? []).forEach(x => {
      existingIncomeByKey.set(dedupeKey(x.description, x.amount, x.date), x.id);
    });

    parsed.expenses.filter(e => e._include && e._categoryId).forEach(e => {
      const iso = new Date(e.date).toISOString();
      const key = dedupeKey(e.description, e.amount, iso);
      const existingId = existingExpenseByKey.get(key);
      if (existingId) deleteExpense(existingId); // override the older entry
      addExpense({
        categoryId: e._categoryId!,
        subCategoryId: e._subCategoryId || undefined,
        amount: e.amount,
        description: e.description,
        date: iso,
      });
      const k = normalizeDesc(e.description);
      if (k) memory[k] = { categoryId: e._categoryId!, subCategoryId: e._subCategoryId || undefined };
      added++;
    });
    parsed.incomes.filter(i => i._include).forEach(i => {
      const iso = new Date(i.date).toISOString();
      const key = dedupeKey(i.description, i.amount, iso);
      const existingId = existingIncomeByKey.get(key);
      if (existingId) deleteIncome(existingId);
      addIncome({
        amount: i.amount,
        description: i.description,
        type: i.type,
        date: iso,
      });
      const k = normalizeDesc(i.description);
      if (k) memory[k] = { ...(memory[k] ?? { categoryId: "" }), incomeType: i.type };
      added++;
    });

    saveMemory(memory);

    if (importSalary && parsed.detectedSalary && parsed.detectedSalary > 0 && effectiveMonth) {
      setSalary(effectiveMonth, parsed.detectedSalary);
    }

    // Track per-month import meta
    const fileName = meta.lastFileName ?? "statement.pdf";
    const newMeta: ImportMeta = {
      ...meta,
      lastFileName: fileName,
      lastImportedAt: new Date().toISOString(),
      byMonth: {
        ...(meta.byMonth ?? {}),
        ...(effectiveMonth ? { [effectiveMonth]: { fileName, importedAt: new Date().toISOString() } } : {}),
      },
    };
    setMeta(newMeta);
    saveMeta(newMeta);

    if (effectiveMonth) setSelectedMonth(effectiveMonth);
    toast({ title: "Importado!", description: `${added} entradas adicionadas${effectiveMonth ? ` a ${effectiveMonth}` : ""}.` });
    setParsed(null);
  };

  // Capture file name when picking — store it on meta so we display "Last import"
  const onFileChange = (file: File) => {
    setMeta(m => {
      const next = { ...m, lastFileName: file.name };
      saveMeta(next);
      return next;
    });
    handleFile(file);
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
      name, icon: newCatIcon || "📦",
      color: "hsl(var(--chart-1))",
      monthlyBudget: 0, subCategories: [],
    });
    setPendingAssign({ name, idx: newCatTargetIdx as any });
    setNewCatOpen(false);
  };

  const applyBulkExpense = () => {
    if (!parsed || bulkSel.size === 0 || !bulkCat) return;
    const n = { ...parsed };
    bulkSel.forEach(i => {
      n.expenses[i]._categoryId = bulkCat;
      n.expenses[i]._subCategoryId = bulkSub || "";
    });
    setParsed({ ...n });
    toast({ title: `Aplicado a ${bulkSel.size} despesa(s)` });
  };

  const applyBulkIncome = () => {
    if (!parsed || bulkIncSel.size === 0 || !bulkIncType) return;
    const n = { ...parsed };
    bulkIncSel.forEach(i => { n.incomes[i].type = bulkIncType; });
    setParsed({ ...n });
    toast({ title: `Aplicado a ${bulkIncSel.size} receita(s)` });
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

  // ----- compact (profile) variant -----
  const triggerButton = (
    <Button onClick={() => fileRef.current?.click()} disabled={loading} size={variant === "compact" ? "sm" : "default"} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : meta.lastFileName ? <RefreshCw className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
      {loading ? "A analisar…" : meta.lastFileName ? "Reimportar extrato" : "Carregar extrato"}
    </Button>
  );

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="application/pdf,image/svg+xml,.pdf,.svg"
      className="hidden"
      onChange={e => e.target.files?.[0] && onFileChange(e.target.files[0])}
    />
  );

  const currentMonthStatusBadge = !curMonthHasImport ? (
    <div
      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
    >
      <AlertTriangle className="h-3 w-3" />
      <span className="capitalize">{curMonthLabel}</span>: extrato em falta
    </div>
  ) : (
    <div
      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-success/40 bg-success/10 text-success"
      title={curMonthImport?.fileName ? `Ficheiro: ${curMonthImport.fileName}` : undefined}
    >
      <Check className="h-3 w-3" />
      <span className="capitalize">{curMonthLabel}</span>: importado
    </div>
  );

  return (
    <>
      {variant === "compact" ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-0">
              {meta.lastFileName ? (
                <p className="text-xs text-muted-foreground truncate">
                  Último: <span className="font-medium text-foreground">{meta.lastFileName}</span>
                  {meta.lastImportedAt && <> · {new Date(meta.lastImportedAt).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}</>}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Ainda sem extrato importado.</p>
              )}
            </div>
            {triggerButton}
            {fileInput}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {currentMonthStatusBadge}
            
          </div>
        </div>
      ) : (
        <Card className="glass-card p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">Importar extrato bancário</h3>
                <p className="text-xs text-muted-foreground">Carrega o PDF mensal — a MONY lê e organiza por ti.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">{triggerButton}</div>
            {fileInput}
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {currentMonthStatusBadge}
            
          </div>
        </Card>
      )}

      <Dialog open={!!parsed} onOpenChange={o => !o && setParsed(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Rever entradas extraídas
            </DialogTitle>
          </DialogHeader>

          {parsed && (
            <div className="space-y-5">
              <div className="text-xs text-muted-foreground">
                Mês do extrato: <span className="font-mono font-semibold text-foreground">{effectiveMonth ?? "desconhecido"}</span>
              </div>

              {monthAlreadyImported && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    Já existe um extrato para <strong>{effectiveMonth}</strong> importado
                    {meta.byMonth?.[effectiveMonth!]?.fileName && <> ({meta.byMonth![effectiveMonth!].fileName})</>}.
                    Ao confirmar, as entradas duplicadas serão substituídas.
                  </div>
                </div>
              )}

              {parsed.detectedSalary != null && parsed.detectedSalary > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={importSalary} onCheckedChange={v => setImportSalary(!!v)} />
                    Definir salário para {effectiveMonth ?? selectedMonth} to
                    <span className="font-mono font-semibold">€{parsed.detectedSalary.toFixed(2)}</span>
                  </label>
                </div>
              )}

              {parsed.incomes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm text-success">
                      Receitas ({parsed.incomes.filter(i => i._include).length})
                    </h4>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox
                        checked={bulkIncSel.size === parsed.incomes.length && parsed.incomes.length > 0}
                        onCheckedChange={v => toggleAllIncomes(!!v)}
                      />
                      Selecionar tudo
                    </label>
                  </div>

                  {bulkIncSel.size > 0 && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-md bg-muted/40 border border-border flex-wrap">
                      <span className="text-xs text-muted-foreground">{bulkIncSel.size} selecionadas →</span>
                      <Input
                        value={bulkIncType}
                        onChange={e => setBulkIncType(e.target.value)}
                        placeholder="Tipo (salário, reembolso…)"
                        className="h-8 text-xs w-44"
                      />
                      <Button size="sm" className="h-8" onClick={applyBulkIncome} disabled={!bulkIncType}>Aplicar</Button>
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
                      Despesas ({parsed.expenses.filter(e => e._include).length})
                    </h4>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox
                        checked={bulkSel.size === parsed.expenses.length && parsed.expenses.length > 0}
                        onCheckedChange={v => toggleAllExpenses(!!v)}
                      />
                      Selecionar tudo
                    </label>
                  </div>

                  {bulkSel.size > 0 && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-md bg-muted/40 border border-border flex-wrap">
                      <span className="text-xs text-muted-foreground">{bulkSel.size} selecionadas →</span>
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
                            <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Nova categoria…</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {bulkSubs.length > 0 && (
                        <Select value={bulkSub || "none"} onValueChange={v => setBulkSub(v === "none" ? "" : v)}>
                          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Subcategoria" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {bulkSubs.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button size="sm" className="h-8" onClick={applyBulkExpense} disabled={!bulkCat}>Aplicar</Button>
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
                            <div className="text-xs text-muted-foreground">{e.date} · sugerido: {e.categoryGuess}</div>
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
                              <SelectValue placeholder="Escolher categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {data.categories.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                              ))}
                              <SelectItem value="__new__">
                                <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Nova categoria…</span>
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
                                <SelectItem value="none">Nenhuma</SelectItem>
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
                      {skipped} despesa(s) sem categoria serão ignoradas.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setParsed(null)}>Cancelar</Button>
            <Button onClick={handleConfirm}>Importar selecionados</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="ex.: Subscrições" />
            </div>
            <div>
              <Label>Ícone</Label>
              <EmojiPickerButton value={newCatIcon} onChange={setNewCatIcon} size="md" ariaLabel="Escolher ícone" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewCatOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateCategory} disabled={!newCatName.trim()}>Criar e atribuir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
