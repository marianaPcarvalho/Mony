import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { User, Wallet, Bell, Check, Mail, Send } from "lucide-react";
import { toast } from "sonner";
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
  const { getProfile, updateProfile } = useStore();
  const profile = getProfile();

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
    </div>
  );
}
