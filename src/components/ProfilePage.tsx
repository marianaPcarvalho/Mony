import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { User, Wallet, Bell, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { BankStatementImport } from "@/components/BankStatementImport";

export function ProfilePage() {
  const { getProfile, updateProfile } = useStore();
  const profile = getProfile();

  const [name, setName] = useState(profile.name);
  const [salary, setSalary] = useState(String(profile.defaultSalary));

  const saveName = () => {
    const v = name.trim() || "Mariana";
    updateProfile({ name: v });
    setName(v);
    toast.success("Nome atualizado");
  };

  const saveSalary = () => {
    const n = parseFloat(salary.replace(",", "."));
    if (isNaN(n) || n < 0) return;
    updateProfile({ defaultSalary: n });
    toast.success("Salário atualizado — pré-preenche novos meses");
  };

  const toggleNotif = (key: keyof typeof profile.notifications) => (v: boolean) => {
    updateProfile({ notifications: { ...profile.notifications, [key]: v } });
  };

  const NOTIF_LABELS: Record<string, { label: string; desc: string }> = {
    budgetAlerts: { label: "Alertas de orçamento", desc: "Avisa-me quando uma categoria ultrapassar o orçamento." },
    savingsReminders: { label: "Lembretes de poupança", desc: "Lembra-me de depositar nos meus objetivos." },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground">Gere a tua conta, salário e notificações.</p>
      </div>

      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight text-foreground">Conta</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-name">Nome</Label>
          <div className="flex gap-2">
            <Input
              id="profile-name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveName()}
              onBlur={saveName}
              placeholder="O teu nome"
            />
            <Button variant="outline" size="icon" onClick={saveName} aria-label="Guardar nome">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight text-foreground">Salário atual</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Este salário será pré-preenchido automaticamente quando começa um mês novo. Podes alterá-lo para qualquer mês individual.
        </p>
        <div className="space-y-2">
          <Label htmlFor="profile-salary">Salário mensal (€)</Label>
          <div className="flex gap-2">
            <Input
              id="profile-salary"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveSalary()}
              onBlur={saveSalary}
            />
            <Button variant="outline" size="icon" onClick={saveSalary} aria-label="Guardar salário">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight text-foreground">Extrato bancário</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Reimporta aqui o teu extrato mensal. Cada mês aceita um extrato — reimportar substitui entradas duplicadas.
        </p>
        <BankStatementImport variant="compact" />
      </Card>

      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight text-foreground">Notificações</h2>
        </div>
        <div className="space-y-3">
          {(["budgetAlerts","savingsReminders"] as const).map(key => (
            <div key={key} className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-muted/40">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{NOTIF_LABELS[key].label}</p>
                <p className="text-xs text-muted-foreground">{NOTIF_LABELS[key].desc}</p>
              </div>
              <Switch checked={profile.notifications[key]} onCheckedChange={toggleNotif(key)} aria-label={NOTIF_LABELS[key].label} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
