import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ChevronDown, ChevronRight, Trash2, Search, Check, X, Pencil } from "lucide-react";
import { EmojiPickerButton } from "./EmojiPickerButton";
import type { Category, SubCategory } from "@/lib/types";

function ProgressRing({ pct, over, size = 56 }: { pct: number; over: boolean; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(pct, 0), 100);
  const offset = c - (clamped / 100) * c;
  const color = over
    ? "hsl(var(--destructive))"
    : pct > 85
    ? "hsl(var(--warning))"
    : "hsl(var(--primary))";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[11px] font-bold tabular-nums ${over ? "text-destructive" : "text-foreground"}`}>
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

function NewCategoryRow({ onCreate, onCancel }: { onCreate: (c: { name: string; icon: string; budget: number }) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [budget, setBudget] = useState("");
  const submit = () => {
    if (!name.trim() || !budget) return;
    onCreate({ name: name.trim(), icon, budget: parseFloat(budget) });
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5">
      <EmojiPickerButton value={icon} onChange={setIcon} size="md" />
      <Input
        autoFocus
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="flex-1"
      />
      <Input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        placeholder="Budget €"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="w-32"
      />
      <Button size="icon" onClick={submit} aria-label="Save">
        <Check className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onCancel} aria-label="Cancel">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CategoryRow({ cat, spent }: { cat: Category; spent: number }) {
  const { updateCategory, deleteCategory, addSubCategory, updateSubCategory, deleteSubCategory } = useStore();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(cat.name);
  const [icon, setIcon] = useState(cat.icon);
  const [budget, setBudget] = useState(String(cat.monthlyBudget));

  const [addingSub, setAddingSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  const subs = cat.subCategories ?? [];
  const pct = cat.monthlyBudget > 0 ? (spent / cat.monthlyBudget) * 100 : 0;
  const over = spent > cat.monthlyBudget && cat.monthlyBudget > 0;

  const startEdit = () => {
    setName(cat.name); setIcon(cat.icon); setBudget(String(cat.monthlyBudget));
    setEditing(true);
  };
  const saveEdit = () => {
    if (!name.trim()) return;
    updateCategory({ ...cat, name: name.trim(), icon, monthlyBudget: parseFloat(budget) || 0 });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 transition-colors overflow-hidden">
      {!editing ? (
        <div className="flex items-center gap-3 p-3 group">
          <button
            onClick={() => subs.length > 0 && setExpanded(!expanded)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {subs.length > 0 ? (
              expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <span className="block w-4" />
            )}
          </button>
          <div className="text-2xl shrink-0" aria-hidden="true">{cat.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-foreground truncate">{cat.name}</p>
              <span className="font-mono text-xs whitespace-nowrap">
                <span className={over ? "text-destructive font-bold" : "text-foreground font-semibold"}>€{spent.toFixed(2)}</span>
                <span className="text-muted-foreground"> / €{cat.monthlyBudget.toFixed(2)}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: over
                    ? "hsl(var(--destructive))"
                    : pct > 85
                    ? "hsl(var(--warning))"
                    : "hsl(var(--primary))",
                }}
              />
            </div>
            {subs.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {subs.length} sub-categor{subs.length === 1 ? "y" : "ies"}
              </p>
            )}
          </div>
          <ProgressRing pct={pct} over={over} />
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setExpanded(true); setAddingSub(true); }} aria-label="Add sub-category">
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit} aria-label="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCategory(cat.id)} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-primary/5">
          <EmojiPickerButton value={icon} onChange={setIcon} size="md" />
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()} autoFocus className="flex-1" />
          <Input type="number" min="0" step="0.01" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()} className="w-32" />
          <Button size="icon" onClick={saveEdit} aria-label="Save"><Check className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(false)} aria-label="Cancel"><X className="h-4 w-4" /></Button>
        </div>
      )}

      {(expanded || addingSub) && (
        <div className="border-t border-border/50 bg-muted/20 px-3 py-2 space-y-1.5">
          {subs.map((sub) =>
            editingSubId === sub.id ? (
              <SubEditRow
                key={sub.id}
                sub={sub}
                onSave={(s) => { updateSubCategory(cat.id, s); setEditingSubId(null); }}
                onCancel={() => setEditingSubId(null)}
              />
            ) : (
              <div key={sub.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 group/sub">
                <span className="text-base" aria-hidden="true">{sub.icon}</span>
                <span className="text-sm text-foreground flex-1">{sub.name}</span>
                <div className="flex gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingSubId(sub.id)} aria-label="Edit sub">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteSubCategory(cat.id, sub.id)} aria-label="Delete sub">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          )}
          {addingSub ? (
            <SubEditRow
              onSave={(s) => { addSubCategory(cat.id, { name: s.name, icon: s.icon }); setAddingSub(false); }}
              onCancel={() => setAddingSub(false)}
            />
          ) : (
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7 gap-1.5 text-muted-foreground" onClick={() => setAddingSub(true)}>
              <Plus className="h-3 w-3" /> Add sub-category
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function SubEditRow({ sub, onSave, onCancel }: { sub?: SubCategory; onSave: (s: SubCategory) => void; onCancel: () => void }) {
  const [name, setName] = useState(sub?.name ?? "");
  const [icon, setIcon] = useState(sub?.icon ?? "📦");
  const submit = () => {
    if (!name.trim()) return;
    onSave({ id: sub?.id ?? "", name: name.trim(), icon });
  };
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/5 border border-primary/20">
      <EmojiPickerButton value={icon} onChange={setIcon} size="sm" />
      <Input
        autoFocus
        placeholder="Sub-category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="h-8 text-sm flex-1"
      />
      <Button size="icon" className="h-7 w-7" onClick={submit} aria-label="Save"><Check className="h-3.5 w-3.5" /></Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel} aria-label="Cancel"><X className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

export function CategoryBudgets() {
  const { data, selectedMonth, getCategorySpent, addCategory } = useStore();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const enriched = useMemo(
    () =>
      data.categories
        .map((c) => ({ ...c, spent: getCategorySpent(c.id, selectedMonth) }))
        .sort((a, b) => b.spent - a.spent),
    [data.categories, data.expenses, selectedMonth, getCategorySpent]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enriched;
    return enriched.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.subCategories ?? []).some((s) => s.name.toLowerCase().includes(q))
    );
  }, [enriched, search]);

  const totalBudget = enriched.reduce((s, c) => s + c.monthlyBudget, 0);
  const totalSpent = enriched.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">
            {enriched.length} categories · €{totalSpent.toFixed(2)} spent of €{totalBudget.toFixed(2)}
          </p>
        </div>
        <Button onClick={() => setAdding(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories or sub-categories…"
          className="pl-9 h-10"
        />
      </div>

      <div className="space-y-2">
        {adding && (
          <NewCategoryRow
            onCreate={({ name, icon, budget }) => {
              addCategory({
                name,
                icon,
                color: `hsl(var(--chart-${(data.categories.length % 6) + 1}))`,
                monthlyBudget: budget,
                subCategories: [],
              });
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        )}
        {filtered.map((cat) => (
          <CategoryRow key={cat.id} cat={cat} spent={cat.spent} />
        ))}
        {filtered.length === 0 && !adding && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {search ? "No categories match your search." : "No categories yet. Click 'New category' to get started."}
          </div>
        )}
      </div>
    </div>
  );
}
