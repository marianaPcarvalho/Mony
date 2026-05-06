import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Trash2, History, ChevronDown, ChevronRight, Pencil, X,
  PiggyBank, Target, CalendarClock, CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { EmojiPickerButton } from "./EmojiPickerButton";
import { SavingsTrendChart } from "./SavingsTrendChart";

const fmt = (v: number) =>
  `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function SavingsGoals() {
  const { data, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addFundsToGoal } = useStore();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏠");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [monthlyContrib, setMonthlyContrib] = useState("");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [addFundAmt, setAddFundAmt] = useState("");
  const [addFundNote, setAddFundNote] = useState("");
  const [fundDialogGoalId, setFundDialogGoalId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [inlineFundGoalId, setInlineFundGoalId] = useState<string | null>(null);
  const [inlineFundAmt, setInlineFundAmt] = useState("");

  const inlineAmtNum = parseFloat(inlineFundAmt);
  const inlineValid = !isNaN(inlineAmtNum) && inlineAmtNum > 0;
  const submitInlineFund = (goalId: string) => {
    if (!inlineValid) return;
    addFundsToGoal(goalId, inlineAmtNum);
    setInlineFundAmt("");
    setInlineFundGoalId(null);
  };

  const getStatus = (goal: { currentAmount: number; targetAmount: number; targetDate?: string; monthlyContribution?: number }) => {
    if (goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount) {
      return { label: "Complete", tone: "success" as const, Icon: CheckCircle2 };
    }
    if (!goal.targetDate && !goal.monthlyContribution) {
      return { label: "No plan", tone: "neutral" as const, Icon: Clock };
    }
    if (goal.targetDate) {
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const t = new Date(goal.targetDate);
      const now = new Date();
      const months = Math.max(0, (t.getFullYear() - now.getFullYear()) * 12 + (t.getMonth() - now.getMonth()));
      const required = months > 0 ? remaining / months : remaining;
      if (goal.monthlyContribution && goal.monthlyContribution > 0) {
        return goal.monthlyContribution >= required
          ? { label: "On track", tone: "success" as const, Icon: CheckCircle2 }
          : { label: "Off track", tone: "destructive" as const, Icon: AlertTriangle };
      }
      // Has date but no monthly plan
      return { label: "Needs plan", tone: "warning" as const, Icon: AlertTriangle };
    }
    // Monthly only, no date — informational
    return { label: "Saving", tone: "neutral" as const, Icon: Clock };
  };

  const resetForm = () => {
    setName(""); setIcon("🏠"); setTarget(""); setCurrent("");
    setTargetDate(""); setMonthlyContrib(""); setEditId(null);
  };

  const targetNum = parseFloat(target);
  const isValid = name.trim().length > 0 && !isNaN(targetNum) && targetNum > 0;

  const handleSave = () => {
    if (!isValid) return;
    const goalData = {
      name: name.trim(),
      icon,
      targetAmount: targetNum,
      currentAmount: parseFloat(current || "0") || 0,
      color: "hsl(var(--savings))",
      targetDate: targetDate || undefined,
      monthlyContribution: parseFloat(monthlyContrib) || undefined,
      fundHistory: [] as any[],
    };
    if (editId) {
      const existing = data.savingsGoals.find(g => g.id === editId);
      if (existing) updateSavingsGoal({ ...existing, ...goalData, fundHistory: existing.fundHistory });
    } else {
      addSavingsGoal(goalData);
    }
    setOpen(false);
    resetForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  const handleEdit = (goal: typeof data.savingsGoals[0]) => {
    setEditId(goal.id);
    setName(goal.name);
    setIcon(goal.icon);
    setTarget(String(goal.targetAmount));
    setCurrent(String(goal.currentAmount));
    setTargetDate(goal.targetDate ?? "");
    setMonthlyContrib(String(goal.monthlyContribution ?? ""));
    setOpen(true);
  };

  const fundAmtNum = parseFloat(addFundAmt);
  const fundValid = !isNaN(fundAmtNum) && fundAmtNum > 0;

  const handleAddFunds = () => {
    if (!fundDialogGoalId || !fundValid) return;
    addFundsToGoal(fundDialogGoalId, fundAmtNum, addFundNote || undefined);
    setFundDialogGoalId(null);
    setAddFundAmt("");
    setAddFundNote("");
  };
  const handleFundKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddFunds();
  };

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };
  const monthsUntil = (dateStr: string) => {
    const t = new Date(dateStr);
    const now = new Date();
    const months = (t.getFullYear() - now.getFullYear()) * 12 + (t.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  const getProjection = (goal: typeof data.savingsGoals[0]) => {
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    if (remaining === 0) return { remaining: 0, requiredPerMonth: 0, projectedMonths: null as number | null, onTrack: true as boolean | null };
    let requiredPerMonth = 0;
    if (goal.targetDate) {
      const m = monthsUntil(goal.targetDate);
      requiredPerMonth = m > 0 ? remaining / m : remaining;
    }
    let projectedMonths: number | null = null;
    let onTrack: boolean | null = null;
    if (goal.monthlyContribution && goal.monthlyContribution > 0) {
      projectedMonths = Math.ceil(remaining / goal.monthlyContribution);
      if (goal.targetDate) onTrack = goal.monthlyContribution >= requiredPerMonth;
    }
    return { remaining, requiredPerMonth, projectedMonths, onTrack };
  };

  const totalPlannedMonthly = data.savingsGoals.reduce((s, g) => s + (g.monthlyContribution ?? 0), 0);
  const totalSaved = data.savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = data.savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const pendingDelete = deleteId ? data.savingsGoals.find(g => g.id === deleteId) : null;

  const stats = [
    { label: "Total saved", value: fmt(totalSaved), icon: PiggyBank, tone: "success" as const },
    { label: "Total target", value: fmt(totalTarget), icon: Target, tone: "neutral" as const },
    { label: "Planned / month", value: fmt(totalPlannedMonthly), icon: CalendarClock, tone: "neutral" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Hero summary — mirrors HomeHero structure */}
      <Card className="glass-card p-6">
        <div className="flex items-baseline justify-between gap-3 mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Savings <span className="text-muted-foreground font-medium ml-2 text-base">{data.savingsGoals.length} {data.savingsGoals.length === 1 ? "goal" : "goals"}</span>
          </h2>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-10" aria-label="New savings goal">
                <Plus className="h-4 w-4" /> New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Savings Goal</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5">
                    <Label>Icon</Label>
                    <EmojiPickerButton value={icon} onChange={setIcon} size="lg" ariaLabel="Pick goal icon" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="goal-name">Name <span className="text-destructive">*</span></Label>
                    <Input id="goal-name" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., House Down Payment" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="goal-target">Target Amount <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                      <Input id="goal-target" type="number" min="0" step="0.01" inputMode="decimal" value={target}
                        onChange={e => setTarget(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" className="pl-7 font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="goal-current">Current Savings</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                      <Input id="goal-current" type="number" min="0" step="0.01" inputMode="decimal" value={current}
                        onChange={e => setCurrent(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" className="pl-7 font-mono" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="goal-date">Target Date</Label>
                    <Input id="goal-date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} onKeyDown={handleKeyDown} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="goal-monthly">Planned Monthly</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                      <Input id="goal-monthly" type="number" min="0" step="0.01" inputMode="decimal" value={monthlyContrib}
                        onChange={e => setMonthlyContrib(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" className="pl-7 font-mono" />
                    </div>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={!isValid} className="w-full">{editId ? "Update" : "Create"} Goal</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Left: overall progress */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Overall progress</span>
              <span className="font-mono text-sm font-bold text-[hsl(var(--savings))]">{overallPct.toFixed(0)}%</span>
            </div>
            <Progress value={overallPct} className="h-3" style={{ ["--progress-color" as any]: "hsl(var(--savings))" }}
              aria-label={`Saved ${fmt(totalSaved)} of ${fmt(totalTarget)} target`} />
            <div className="flex items-baseline justify-between font-mono text-sm">
              <span className="font-semibold text-[hsl(var(--savings))]">{fmt(totalSaved)}</span>
              <span className="text-muted-foreground">of {fmt(totalTarget)}</span>
            </div>
          </div>

          {/* Right: stats column */}
          <div className="space-y-3">
            {stats.map(s => (
              <div key={s.label} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.tone === "success" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{s.label}</span>
                </div>
                <span className={`font-mono font-bold text-base ${s.tone === "success" ? "text-success" : "text-foreground"}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Trend over time */}
      <SavingsTrendChart />

      {/* Goals list */}
      <Card className="glass-card p-5 space-y-3">
        <h3 className="section-title flex items-center gap-2">
          <PiggyBank className="h-4 w-4 text-muted-foreground" /> Your goals
        </h3>

        {data.savingsGoals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">
            No savings goals yet. Click <strong>New Goal</strong> to start planning for your future!
          </p>
        )}

        <div className="space-y-3">
          {data.savingsGoals.map(goal => {
            const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const isExpanded = expandedGoal === goal.id;
            const history = goal.fundHistory ?? [];
            const proj = getProjection(goal);
            const isComplete = goal.currentAmount >= goal.targetAmount && goal.targetAmount > 0;
            const status = getStatus(goal);
            const isInlineOpen = inlineFundGoalId === goal.id;
            const statusToneCls =
              status.tone === "success" ? "bg-success/15 text-success border-success/30" :
              status.tone === "destructive" ? "bg-destructive/15 text-destructive border-destructive/30" :
              status.tone === "warning" ? "bg-warning/15 text-warning border-warning/30" :
              "bg-muted text-muted-foreground border-border";

            return (
              <div key={goal.id} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <div className="p-4 space-y-3 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0" aria-hidden="true">{goal.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground truncate">{goal.name}</p>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusToneCls}`}
                            aria-label={`Status: ${status.label}`}
                          >
                            <status.Icon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          <span className="font-semibold text-[hsl(var(--savings))]">{fmt(goal.currentAmount)}</span>
                          <span className="text-muted-foreground"> / {fmt(goal.targetAmount)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-sm font-bold font-mono ${isComplete ? "text-success" : "text-[hsl(var(--savings))]"}`}>
                        {pct.toFixed(0)}%
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(goal)} aria-label={`Edit ${goal.name}`}>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(goal.id)} aria-label={`Delete ${goal.name}`}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <Progress value={pct} className="h-2.5"
                    style={{ ["--progress-color" as any]: isComplete ? "hsl(var(--success))" : "hsl(var(--savings))" }}
                    aria-label={`${goal.name}: ${pct.toFixed(0)} percent saved`} />

                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex gap-3 flex-wrap text-muted-foreground">
                      {goal.targetDate && (
                        <span className="text-foreground">
                          {daysUntil(goal.targetDate)} days left · {new Date(goal.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                      {goal.monthlyContribution && <span>Planned: {fmt(goal.monthlyContribution)}/mo</span>}
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        variant={isInlineOpen ? "secondary" : "outline"}
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => {
                          if (isInlineOpen) { setInlineFundGoalId(null); setInlineFundAmt(""); }
                          else { setInlineFundGoalId(goal.id); setInlineFundAmt(""); }
                        }}
                        aria-expanded={isInlineOpen}
                      >
                        {isInlineOpen ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Add Funds
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)} aria-expanded={isExpanded}>
                        <History className="h-3 w-3" /> History
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>

                  {isInlineOpen && (
                    <form
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2"
                      onSubmit={(e) => { e.preventDefault(); submitInlineFund(goal.id); }}
                    >
                      <Label htmlFor={`inline-fund-${goal.id}`} className="sr-only">Amount to add</Label>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                        <Input
                          id={`inline-fund-${goal.id}`}
                          type="number" min="0" step="0.01" inputMode="decimal"
                          value={inlineFundAmt}
                          onChange={(e) => setInlineFundAmt(e.target.value)}
                          placeholder="0.00"
                          className="pl-7 h-8 font-mono text-sm"
                          autoFocus
                        />
                      </div>
                      <Button type="submit" size="sm" className="h-8 text-xs" disabled={!inlineValid}>Add</Button>
                    </form>
                  )}

                  {proj.remaining > 0 && (goal.targetDate || (goal.monthlyContribution && goal.monthlyContribution > 0)) && (
                    <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Remaining</p>
                        <p className="font-mono font-semibold text-foreground">{fmt(proj.remaining)}</p>
                      </div>
                      {goal.targetDate && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Required / month</p>
                          <p className="font-mono font-semibold text-foreground">{fmt(proj.requiredPerMonth)}</p>
                        </div>
                      )}
                      {proj.projectedMonths !== null && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">At planned pace</p>
                          <p className={`font-mono font-semibold ${proj.onTrack === false ? "text-destructive" : proj.onTrack === true ? "text-success" : "text-foreground"}`}>
                            {proj.projectedMonths} {proj.projectedMonths === 1 ? "month" : "months"}
                            {proj.onTrack === false && " · behind"}
                            {proj.onTrack === true && " · on track"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-border/60 px-4 py-3 bg-muted/20 max-h-[220px] overflow-y-auto">
                    {history.length > 0 ? (
                      <ul className="space-y-1.5">
                        {history.slice().reverse().map(entry => (
                          <li key={entry.id} className="flex items-center justify-between text-xs py-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[hsl(var(--savings))] font-mono font-semibold">+{fmt(entry.amount)}</span>
                              {entry.note && <span className="text-foreground truncate">{entry.note}</span>}
                            </div>
                            <span className="text-muted-foreground flex-shrink-0">{new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">No fund entries yet. Add funds to start tracking!</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add funds dialog */}
      <Dialog open={!!fundDialogGoalId} onOpenChange={(v) => { if (!v) { setFundDialogGoalId(null); setAddFundAmt(""); setAddFundNote(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Funds</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="fund-amount">Amount <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                <Input id="fund-amount" type="number" min="0" step="0.01" inputMode="decimal" value={addFundAmt}
                  onChange={e => setAddFundAmt(e.target.value)} onKeyDown={handleFundKeyDown} placeholder="0.00" className="pl-7 font-mono" autoFocus />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fund-note">Note (optional)</Label>
              <Input id="fund-note" value={addFundNote} onChange={e => setAddFundNote(e.target.value)} onKeyDown={handleFundKeyDown} placeholder="e.g., Bonus from work" maxLength={120} />
            </div>
            <Button onClick={handleAddFunds} disabled={!fundValid} className="w-full">Add Funds</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? (
                <>This will permanently remove <strong>{pendingDelete.name}</strong> and its entire fund history ({fmt(pendingDelete.currentAmount)} saved). This action cannot be undone.</>
              ) : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) deleteSavingsGoal(deleteId); setDeleteId(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
