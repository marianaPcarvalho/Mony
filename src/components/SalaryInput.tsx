import { useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Check } from "lucide-react";

export function SalaryInput() {
  const { selectedMonth, getSalary, setSalary } = useStore();
  const current = getSalary(selectedMonth);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(current));

  const handleSave = () => {
    setSalary(selectedMonth, parseFloat(value) || 0);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button onClick={() => { setValue(String(current)); setEditing(true); }}
        className="text-left">
        <Card className="glass-card p-3 flex items-center gap-3 hover:border-accent/50 transition-colors cursor-pointer">
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Salary</p>
            <p className="font-mono font-bold text-sm">€{current.toLocaleString("en", { minimumFractionDigits: 2 })}</p>
          </div>
        </Card>
      </button>
    );
  }

  return (
    <Card className="glass-card p-3 flex items-center gap-2">
      <Input type="number" value={value} onChange={e => setValue(e.target.value)} className="h-8 font-mono" autoFocus
        onKeyDown={e => e.key === "Enter" && handleSave()} />
      <Button size="icon" className="h-8 w-8 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave}>
        <Check className="h-3.5 w-3.5" />
      </Button>
    </Card>
  );
}
