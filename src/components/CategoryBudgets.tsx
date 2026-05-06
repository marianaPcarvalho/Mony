import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown, ChevronRight, Trash2, Search, Check, X, Pencil } from "lucide-react";
import { EmojiPickerButton } from "./EmojiPickerButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Category, SubCategory } from "@/lib/types";

const TAG_COLORS: { name: string; value: string }[] = [
  { name: "Blue",   value: "hsl(220, 70%, 55%)" },
  { name: "Teal",   value: "hsl(178, 60%, 40%)" },
  { name: "Green",  value: "hsl(142, 55%, 42%)" },
  { name: "Lime",   value: "hsl(82, 55%, 45%)" },
  { name: "Amber",  value: "hsl(38, 92%, 50%)" },
  { name: "Orange", value: "hsl(24, 85%, 55%)" },
  { name: "Red",    value: "hsl(0, 70%, 55%)" },
  { name: "Pink",   value: "hsl(330, 70%, 58%)" },
  { name: "Purple", value: "hsl(270, 55%, 55%)" },
  { name: "Slate",  value: "hsl(220, 14%, 50%)" },
];
const DEFAULT_TAG_COLOR = TAG_COLORS[0].value;

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-5 w-5 rounded-full border border-border shrink-0 shadow-sm"
          style={{ background: value }}
          aria-label="Pick color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-5 gap-1.5">
          {TAG_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${value === c.value ? "ring-2 ring-foreground ring-offset-1" : "border-border"}`}
              style={{ background: c.value }}
              aria-label={c.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="transparent" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="transparent"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
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
      <Input autoFocus placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} className="flex-1" />
      <div className="relative w-36">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">€</span>
        <Input type="number" min="0" step="0.01" inputMode="decimal" placeholder="Monthly budget" value={budget} onChange={(e) => setBudget(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} className="pl-6" />
      </div>
      <Button size="icon" onClick={submit} aria-label="Save"><Check className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" onClick={onCancel} aria-label="Cancel"><X className="h-4 w-4" /></Button>
    </div>
  );
}

function CategoryRow({ cat, spent }: { cat: Category; spent: number }) {
  const { updateCategory, deleteCategory, addSubCategory, updateSubCategory, deleteSubCategory } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [icon, setIcon] = useState(cat.icon);
  const [budget, setBudget] = useState(String(cat.monthlyBudget));
  const [editingBudget, setEditingBudget] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [addingSub, setAddingSub] = useState(false);

  const subs = cat.subCategories ?? [];
  const pct = cat.monthlyBudget > 0 ? (spent / cat.monthlyBudget) * 100 : 0;
  const over = spent > cat.monthlyBudget && cat.monthlyBudget > 0;

  const startEdit = () => { setName(cat.name); setIcon(cat.icon); setBudget(String(cat.monthlyBudget)); setEditing(true); };
  const saveEdit = () => {
    if (!name.trim()) return;
    updateCategory({ ...cat, name: name.trim(), icon, monthlyBudget: parseFloat(budget) || 0 });
    setEditing(false);
  };
  const saveBudget = () => {
    updateCategory({ ...cat, monthlyBudget: parseFloat(budget) || 0 });
    setEditingBudget(false);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 transition-colors overflow-hidden">
      {!editing ? (
        <div className="p-3 space-y-3">
          {/* Top row */}
          <div className="flex items-center gap-3">
            <div className="text-2xl shrink-0" aria-hidden="true">{cat.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-semibold text-foreground truncate">{cat.name}</p>
                {!editingBudget ? (
                  <button
                    onClick={() => { setBudget(String(cat.monthlyBudget)); setEditingBudget(true); }}
                    className="group/budget inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted border border-border/60 transition-colors"
                    aria-label="Edit monthly budget"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Budget</span>
                    <span className="font-mono text-xs font-bold text-foreground">€{cat.monthlyBudget.toFixed(2)}</span>
                    <Pencil className="h-3 w-3 text-muted-foreground group-hover/budget:text-foreground" />
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-primary/40 bg-primary/5">
                    <span className="text-xs text-muted-foreground">€</span>
                    <Input
                      autoFocus
                      type="number" min="0" step="0.01" inputMode="decimal"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveBudget(); if (e.key === "Escape") setEditingBudget(false); }}
                      onBlur={saveBudget}
                      className="h-6 w-20 px-1 text-xs font-mono border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono">
                  <span className={over ? "text-destructive font-bold" : "text-foreground font-semibold"}>€{spent.toFixed(2)}</span>
                  <span className="text-muted-foreground"> spent</span>
                </span>
                {over && <span className="text-[10px] uppercase tracking-wider text-destructive font-bold">Over budget</span>}
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: over ? "hsl(var(--destructive))" : pct > 85 ? "hsl(var(--warning))" : "hsl(var(--primary))",
                  }}
                />
              </div>
            </div>
            <ProgressRing pct={pct} over={over} />
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startEdit} aria-label="Edit category">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)} aria-label="Delete category">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Sub-categories — always visible */}
          <div className="border-t border-border/40 pt-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Sub-categories {subs.length > 0 && <span className="ml-1 text-foreground/70">({subs.length})</span>}
              </p>
            </div>
            {subs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {subs.map((sub) =>
                  editingSubId === sub.id ? (
                    <SubEditRow
                      key={sub.id}
                      sub={sub}
                      onSave={(s) => { updateSubCategory(cat.id, s); setEditingSubId(null); }}
                      onCancel={() => setEditingSubId(null)}
                    />
                  ) : (
                    <div
                      key={sub.id}
                      className="group/sub inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full border text-xs font-medium"
                      style={{
                        background: `${sub.color ?? DEFAULT_TAG_COLOR}1A`,
                        borderColor: `${sub.color ?? DEFAULT_TAG_COLOR}66`,
                        color: sub.color ?? DEFAULT_TAG_COLOR,
                      }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: sub.color ?? DEFAULT_TAG_COLOR }} aria-hidden="true" />
                      <button onClick={() => setEditingSubId(sub.id)} className="hover:underline" aria-label={`Edit ${sub.name}`}>
                        {sub.name}
                      </button>
                      <button onClick={() => deleteSubCategory(cat.id, sub.id)} className="rounded-full p-0.5 opacity-60 hover:opacity-100" aria-label={`Delete ${sub.name}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
            {addingSub ? (
              <SubEditRow
                onSave={(s) => { addSubCategory(cat.id, { name: s.name, icon: "", color: s.color }); setAddingSub(false); }}
                onCancel={() => setAddingSub(false)}
              />
            ) : (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-dashed" onClick={() => setAddingSub(true)}>
                <Plus className="h-3 w-3" /> Add sub-category
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-primary/5">
          <EmojiPickerButton value={icon} onChange={setIcon} size="md" />
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()} autoFocus className="flex-1" />
          <div className="relative w-36">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">€</span>
            <Input type="number" min="0" step="0.01" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()} className="pl-6" />
          </div>
          <Button size="icon" onClick={saveEdit} aria-label="Save"><Check className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(false)} aria-label="Cancel"><X className="h-4 w-4" /></Button>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category and all its sub-categories. Existing expenses in this category will remain but become uncategorized. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategory(cat.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SubEditRow({ sub, onSave, onCancel }: { sub?: SubCategory; onSave: (s: SubCategory) => void; onCancel: () => void }) {
  const [name, setName] = useState(sub?.name ?? "");
  const [color, setColor] = useState(sub?.color ?? DEFAULT_TAG_COLOR);
  const submit = () => {
    if (!name.trim()) return;
    onSave({ id: sub?.id ?? "", name: name.trim(), icon: sub?.icon ?? "", color });
  };
  return (
    <div
      className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full border"
      style={{ background: `${color}14`, borderColor: `${color}66` }}
    >
      <ColorPicker value={color} onChange={setColor} />
      <Input
        autoFocus
        placeholder="Tag name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
        className="h-6 text-xs flex-1 border-0 bg-transparent px-1 focus-visible:ring-0 focus-visible:ring-offset-0 w-36"
      />
      <Button size="icon" className="h-6 w-6 rounded-full" onClick={submit} aria-label="Save"><Check className="h-3 w-3" /></Button>
      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={onCancel} aria-label="Cancel"><X className="h-3 w-3" /></Button>
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
                name, icon,
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
