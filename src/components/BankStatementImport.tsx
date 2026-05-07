import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Sparkles, Loader2, FileText } from "lucide-react";
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

export function BankStatementImport() {
  const { data, addExpense, addIncome, setSalary, selectedMonth } = useStore();
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [importSalary, setImportSalary] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

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
        date: e.date,
      });
      added++;
    });
    parsed.incomes.filter(i => i._include).forEach(i => {
      addIncome({ amount: i.amount, description: i.description, type: i.type, date: i.date });
      added++;
    });
    if (importSalary && parsed.detectedSalary && parsed.detectedSalary > 0) {
      const month = parsed.statementMonth ?? selectedMonth;
      setSalary(month, parsed.detectedSalary);
    }
    toast({ title: "Imported!", description: `${added} entries added.` });
    setParsed(null);
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
              {parsed.detectedSalary != null && parsed.detectedSalary > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={importSalary} onCheckedChange={v => setImportSalary(!!v)} />
                    Set salary for {parsed.statementMonth ?? selectedMonth} to
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
    </>
  );
}
