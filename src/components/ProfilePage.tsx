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
  const [previewBusy, setPreviewBusy] = useState(false);
  const [name, setName] = useState(profile.name);
  const [salary, setSalary] = useState(String(profile.defaultSalary));

  const saveName = () => {
    const v = name.trim() || "Mariana";
    updateProfile({ name: v });
    setName(v);
    toast.success("Name updated");
  };

  const saveSalary = () => {
    const n = parseFloat(salary.replace(",", "."));
    if (isNaN(n) || n < 0) return;
    updateProfile({ defaultSalary: n });
    toast.success("Salary updated — will pre-fill new months");
  };

  const toggleNotif = (key: keyof typeof profile.notifications) => (v: boolean) => {
    updateProfile({ notifications: { ...profile.notifications, [key]: v } });
  };

  const saveRecap = async () => {
    const e = recapEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) { toast.error("Enter a valid email"); return; }
    setRecapBusy(true);
    try {
      // Push current snapshot first so the cloud has data
      await pushSnapshot(data);
      const { error } = await updateSubscription({ email: e, enabled: recapEnabled });
      if (error) throw error;
      setLocalSubscriber({ email: e, enabled: recapEnabled });
      toast.success("Subscribed — you'll get a recap on the 1st of each month");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not subscribe");
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
    toast.success(v ? "Monthly recaps resumed" : "Monthly recaps paused");
  };

  const unsubscribe = async () => {
    setRecapBusy(true);
    try {
      await updateSubscription({ email: "" });
      setLocalSubscriber(null);
      setRecapEmail("");
      toast.success("Unsubscribed");
    } finally { setRecapBusy(false); }
  };

  const sendPreview = async () => {
    setPreviewBusy(true);
    try {
      await pushSnapshot(data);
      const { error } = await sendRecapPreview();
      if (error) throw error;
      toast.success("Preview sent — check your inbox");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send preview");
    } finally {
      setPreviewBusy(false);
    }
  };

  const isSubscribed = !!getLocalSubscriber();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account, salary and notifications.</p>
      </div>

      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight text-foreground">Account</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-name">Name</Label>
          <div className="flex gap-2">
            <Input
              id="profile-name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveName()}
              onBlur={saveName}
              placeholder="Your name"
            />
            <Button variant="outline" size="icon" onClick={saveName} aria-label="Save name">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight text-foreground">Current salary</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          This salary will pre-fill automatically when a new month starts. You can still override it for any individual month.
        </p>
        <div className="space-y-2">
          <Label htmlFor="profile-salary">Monthly salary (€)</Label>
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
            <Button variant="outline" size="icon" onClick={saveSalary} aria-label="Save salary">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight text-foreground">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { key: "budgetAlerts" as const, label: "Budget alerts", desc: "Notify me when a category goes over budget." },
            { key: "monthlySummary" as const, label: "Monthly summary", desc: "Send me a recap at the end of every cycle." },
            { key: "savingsReminders" as const, label: "Savings reminders", desc: "Remind me to deposit toward my goals." },
          ].map(n => (
            <div key={n.key} className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-muted/40">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch checked={profile.notifications[n.key]} onCheckedChange={toggleNotif(n.key)} aria-label={n.label} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight text-foreground">Monthly email recap</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Get a summary delivered on the 1st of each month with your category breakdown, top expenses, and savings progress. Your data is securely synced so we can build the recap.
        </p>
        <div className="space-y-2">
          <Label htmlFor="recap-email">Email address</Label>
          <div className="flex gap-2">
            <Input
              id="recap-email"
              type="email"
              inputMode="email"
              value={recapEmail}
              onChange={e => setRecapEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveRecap()}
              placeholder="you@example.com"
              disabled={recapBusy}
            />
            <Button onClick={saveRecap} disabled={recapBusy || !recapEmail.trim()}>
              {isSubscribed ? "Update" : "Subscribe"}
            </Button>
          </div>
        </div>

        {isSubscribed && (
          <>
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-muted/40">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Send monthly recap</p>
                <p className="text-xs text-muted-foreground">Pause if you don't want any emails.</p>
              </div>
              <Switch checked={recapEnabled} onCheckedChange={toggleRecapEnabled} aria-label="Enable recap" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={sendPreview} disabled={previewBusy} className="gap-2">
                <Send className="h-4 w-4" />
                {previewBusy ? "Sending..." : "Send preview now"}
              </Button>
              <Button variant="ghost" onClick={unsubscribe} disabled={recapBusy} className="text-destructive">
                Unsubscribe
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
