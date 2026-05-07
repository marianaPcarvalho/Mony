import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { User, Wallet, Bell, Check, Mail, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import { BankStatementImport } from "@/components/BankStatementImport";
import {
  getLocalSubscriber, setLocalSubscriber,
  updateSubscription, sendRecapPreview, pushSnapshot,
} from "@/lib/cloudSync";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProfilePage() {
  const { getProfile, updateProfile, data } = useStore();
  const profile = getProfile();

  const initialSub = getLocalSubscriber();
  const [recapEmail, setRecapEmail] = useState(initialSub?.email ?? "");
  const [recapEnabled, setRecapEnabled] = useState(initialSub?.enabled ?? true);
  const [recapBusy, setRecapBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
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

  const saveRecap = async () => {
    const e = recapEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) { toast.error("Introduz um email válido"); return; }
    setRecapBusy(true);
    try {
      await pushSnapshot(data);
      const { error } = await updateSubscription({ email: e, enabled: recapEnabled });
      if (error) throw error;
      setLocalSubscriber({ email: e, enabled: recapEnabled });
      toast.success("Subscrito — vais receber um resumo no dia 1 de cada mês");
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível subscrever");
    } finally {
      setRecapBusy(false);
    }
  };

  const toggleRecapEnabled = async (v: boolean) => {
    setRecapEnabled(v);
    const sub = getLocalSubscriber();
    if (!sub) return;
    await updateSubscription({ enabled: v });
    setLocalSubscriber({ ...sub, enabled: v });
    toast.success(v ? "Resumos mensais reativados" : "Resumos mensais pausados");
  };

  const unsubscribe = async () => {
    setRecapBusy(true);
    try {
      await updateSubscription({ email: "" });
      setLocalSubscriber(null);
      setRecapEmail("");
      toast.success("Subscrição removida");
    } finally { setRecapBusy(false); }
  };

  const resendNow = async () => {
    const e = recapEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) { toast.error("Introduz um email válido"); return; }

    setResendBusy(true);
    try {
      await pushSnapshot(data);
      const local = getLocalSubscriber();
      if (!local || local.email !== e || local.enabled !== recapEnabled) {
        const { error: subError } = await updateSubscription({ email: e, enabled: recapEnabled });
        if (subError) throw subError;
        setLocalSubscriber({ email: e, enabled: recapEnabled });
      }
      const { error } = await sendRecapPreview();
      if (error) throw error;
      toast.success("Resumo reenviado — verifica o teu email");
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível reenviar o resumo");
    } finally {
      setResendBusy(false);
    }
  };

  const isSubscribed = !!getLocalSubscriber();

  const NOTIF_LABELS: Record<string, { label: string; desc: string }> = {
    budgetAlerts: { label: "Alertas de orçamento", desc: "Avisa-me quando uma categoria ultrapassar o orçamento." },
    monthlySummary: { label: "Resumo mensal", desc: "Envia-me um resumo no fim de cada ciclo." },
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
          {(["budgetAlerts","monthlySummary","savingsReminders"] as const).map(key => (
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

      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight text-foreground">Resumo mensal por email</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Recebe um resumo no dia 1 de cada mês com a distribuição por categorias, principais despesas e progresso de poupança. Os teus dados são sincronizados em segurança.
        </p>
        <div className="space-y-2">
          <Label htmlFor="recap-email">Endereço de email</Label>
          <div className="flex gap-2">
            <Input
              id="recap-email"
              type="email"
              inputMode="email"
              value={recapEmail}
              onChange={e => setRecapEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveRecap()}
              placeholder="tu@exemplo.com"
              disabled={recapBusy}
            />
            <Button onClick={saveRecap} disabled={recapBusy || !recapEmail.trim()}>
              {isSubscribed ? "Atualizar" : "Subscrever"}
            </Button>
          </div>
        </div>

        {isSubscribed && (
          <>
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-muted/40">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Enviar resumo mensal</p>
                <p className="text-xs text-muted-foreground">Pausa se não quiseres receber emails.</p>
              </div>
              <Switch checked={recapEnabled} onCheckedChange={toggleRecapEnabled} aria-label="Ativar resumo" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={resendNow} disabled={resendBusy} className="gap-2">
                <Send className="h-4 w-4" />
                {resendBusy ? "A enviar..." : "Reenviar resumo agora"}
              </Button>
              <Button variant="ghost" onClick={unsubscribe} disabled={recapBusy} className="text-destructive">
                Cancelar subscrição
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
