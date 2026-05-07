import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { buildMonthlyReport, previousMonth } from "@/lib/monthly-report";
import { sendMonthlyReportEmail } from "@/lib/monthly-report-api";

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function ProfileSettings() {
  const {
    data,
    selectedMonth,
    setMonthlyReportEmail,
    setMonthlyReportEnabled,
    markMonthlyReportSent,
  } = useStore();
  const [email, setEmail] = useState(data.monthlyEmailReport?.email ?? "");
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    setEmail(data.monthlyEmailReport?.email ?? "");
  }, [data.monthlyEmailReport?.email]);

  const canEnable = email.trim().length > 0;
  const isEnabled = data.monthlyEmailReport?.enabled ?? false;
  const lastSentMonth = data.monthlyEmailReport?.lastSentMonth;

  const autoSendMonth = useMemo(() => previousMonth(currentMonthKey()), []);

  const sendReport = async (month: string) => {
    const recipient = (data.monthlyEmailReport?.email ?? "").trim();
    if (!recipient) {
      throw new Error("Please add an email first.");
    }

    const report = buildMonthlyReport(data, month);
    await sendMonthlyReportEmail(recipient, report);
    markMonthlyReportSent(month);
  };

  useEffect(() => {
    if (!isEnabled) return;
    if (!data.monthlyEmailReport?.email?.trim()) return;
    if (lastSentMonth === autoSendMonth) return;

    let cancelled = false;
    setIsSending(true);
    setStatusMessage("Sending last month's report...");

    sendReport(autoSendMonth)
      .then(() => {
        if (!cancelled) {
          setStatusMessage("Monthly report sent successfully.");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatusMessage(error instanceof Error ? error.message : "Could not send monthly report.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isEnabled, data.monthlyEmailReport?.email, lastSentMonth, autoSendMonth]);

  const handleSaveEmail = () => {
    setMonthlyReportEmail(email.trim());
    setStatusMessage("Email updated.");
  };

  const handleResendNow = async () => {
    try {
      setIsSending(true);
      setStatusMessage("Sending report...");
      await sendReport(selectedMonth);
      setStatusMessage("Report sent successfully.");
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "Could not send report.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Perfil</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as notificacoes de email para receber o resumo mensal.
          </p>
        </div>

        <div className="rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold">Resumo mensal por email</h3>
              <p className="text-sm text-muted-foreground">
                Receba automaticamente o resumo do ultimo mes e envie novamente quando quiser.
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => setMonthlyReportEnabled(checked && canEnable)}
              aria-label="Ativar resumo mensal por email"
              disabled={!canEnable}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-monthly-report-email">Email</Label>
            <div className="flex gap-2">
              <Input
                id="profile-monthly-report-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu-email@exemplo.com"
              />
              <Button onClick={handleSaveEmail} variant="secondary">
                Salvar
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleResendNow} disabled={isSending || !canEnable}>
              {isSending ? "A enviar..." : "Reenviar resumo agora"}
            </Button>
          </div>

          {statusMessage && (
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
