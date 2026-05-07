import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudget: number;
  subCategories?: { id: string; name: string; icon: string }[];
  recurring?: boolean;
}

interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
}

interface Income {
  id: string;
  amount: number;
  description: string;
  type: string;
  date: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  targetDate?: string;
}

interface AppData {
  categories: Category[];
  incomes?: Income[];
  expenses: Expense[];
  monthlyConfigs: { month: string; salary: number; budget: number }[];
  savingsGoals: SavingsGoal[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { deviceToken } = body ?? {};

    if (typeof deviceToken !== "string" || !UUID_RE.test(deviceToken)) {
      return json({ error: "Invalid deviceToken" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables are not configured");
    }
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    if (!RESEND_FROM_EMAIL || !EMAIL_RE.test(RESEND_FROM_EMAIL)) {
      throw new Error("RESEND_FROM_EMAIL is not configured or is invalid");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: subscriber, error: subscriberError } = await supabase
      .from("recap_subscribers")
      .select("email")
      .eq("device_token", deviceToken)
      .single();

    if (subscriberError || !subscriber?.email) {
      return json({ error: "Subscriber not found" }, 404);
    }

    const { data: snapshot, error: snapshotError } = await supabase
      .from("cloud_snapshots")
      .select("data")
      .eq("device_token", deviceToken)
      .single();

    if (snapshotError || !snapshot?.data) {
      return json({ error: "No snapshot found" }, 404);
    }

    const data = snapshot.data as AppData;
    const html = buildRecapPreviewEmail(data);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: subscriber.email,
        subject: "Prévia do resumo mensal",
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return json({ error: "Failed to send preview email", details: errorText }, response.status);
    }

    return json({ ok: true, sentTo: subscriber.email });
  } catch (error) {
    console.error("send-recap-preview error", error);
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});

function buildRecapPreviewEmail(data: AppData) {
  const currency = new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  });

  const totalIncome = (data.incomes ?? []).reduce((sum, income) => sum + income.amount, 0);
  const totalSpent = (data.expenses ?? []).reduce((sum, expense) => sum + expense.amount, 0);
  const monthName = new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  const categoryMap = new Map(data.categories?.map((category) => [category.id, category]) ?? []);

  const categoryTotals = data.expenses.reduce((totals, expense) => {
    const category = categoryMap.get(expense.categoryId);
    const label = category ? category.name : "Outros";
    totals[label] = (totals[label] ?? 0) + expense.amount;
    return totals;
  }, {} as Record<string, number>);

  const topExpenses = [...(data.expenses ?? [])]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const goals = data.savingsGoals ?? [];

  return `
    <div style="font-family:system-ui, sans-serif; color:#111; line-height:1.5; max-width:680px; margin:0 auto; padding:24px;">
      <h1 style="font-size:28px; margin-bottom:12px;">Prévia do resumo mensal — ${monthName}</h1>
      <p style="margin-bottom:24px; color:#555;">Esta é uma pré-visualização do email que será enviado quando o teu resumo mensal for gerado.</p>

      <section style="margin-bottom:24px;">
        <h2 style="font-size:18px; margin-bottom:10px;">Resumo rápido</h2>
        <p style="margin:0.25rem 0;"><strong>Recebido:</strong> ${currency.format(totalIncome)}</p>
        <p style="margin:0.25rem 0;"><strong>Gasto:</strong> ${currency.format(totalSpent)}</p>
        <p style="margin:0.25rem 0;"><strong>Saldo líquido:</strong> ${currency.format(totalIncome - totalSpent)}</p>
      </section>

      <section style="margin-bottom:24px;">
        <h2 style="font-size:18px; margin-bottom:10px;">Despesas por categoria</h2>
        <ul style="padding-left:18px; margin:0;">
          ${Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .map(
              ([category, amount]) =>
                `<li style="margin-bottom:6px;"><strong>${category}:</strong> ${currency.format(amount)}</li>`,
            )
            .join("")}
        </ul>
      </section>

      <section style="margin-bottom:24px;">
        <h2 style="font-size:18px; margin-bottom:10px;">Top 5 despesas</h2>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left; padding:8px 0; border-bottom:1px solid #ddd;">Descrição</th>
              <th style="text-align:right; padding:8px 0; border-bottom:1px solid #ddd;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${topExpenses
              .map(
                (expense) =>
                  `<tr><td style="padding:8px 0;">${escapeHtml(expense.description)}</td><td style="padding:8px 0; text-align:right;">${currency.format(expense.amount)}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </section>

      <section style="margin-bottom:24px;">
        <h2 style="font-size:18px; margin-bottom:10px;">Objetivos de poupança</h2>
        ${goals.length
          ? `<ul style="padding-left:18px; margin:0;">${goals
              .map(
                (goal) =>
                  `<li style="margin-bottom:10px;"><strong>${escapeHtml(goal.name)}</strong> — ${currency.format(goal.currentAmount)} de ${currency.format(goal.targetAmount)}${goal.targetDate ? ` até ${new Date(goal.targetDate).toLocaleDateString("pt-PT")}` : ""}</li>`,
              )
              .join("")}</ul>`
          : `<p style="margin:0; color:#555;">Ainda não tens objetivos de poupança definidos.</p>`}
      </section>

      <footer style="color:#777; font-size:13px;">
        <p style="margin:0;">Isto é apenas um teste de pré-visualização. O resumo mensal real será enviado no dia 1 de cada mês.</p>
      </footer>
    </div>
  `;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
