import { createClient } from "@supabase/supabase-js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).send("ok");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: "RESEND_API_KEY is not configured" });
  }
  if (!RESEND_FROM_EMAIL || !EMAIL_RE.test(RESEND_FROM_EMAIL)) {
    return res.status(500).json({ error: "RESEND_FROM_EMAIL is not configured or invalid" });
  }

  try {
    const body = req.body as any;
    const deviceToken = body?.deviceToken;

    if (typeof deviceToken !== "string" || !UUID_RE.test(deviceToken)) {
      return res.status(400).json({ error: "Invalid deviceToken" });
    }

    const { data: subscriber, error: subscriberError } = await supabase
      .from("recap_subscribers")
      .select("email")
      .eq("device_token", deviceToken)
      .single();

    if (subscriberError || !subscriber?.email) {
      return res.status(404).json({ error: "Subscriber not found" });
    }

    const { data: snapshot, error: snapshotError } = await supabase
      .from("cloud_snapshots")
      .select("data")
      .eq("device_token", deviceToken)
      .single();

    if (snapshotError || !snapshot?.data) {
      return res.status(404).json({ error: "No snapshot found" });
    }

    const emailHtml = buildRecapPreviewEmail(snapshot.data);
    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: subscriber.email,
        subject: "Prévia do resumo mensal",
        html: emailHtml,
      }),
    });

    if (!sendRes.ok) {
      const details = await sendRes.text();
      console.error("Resend API error:", details);
      return res.status(sendRes.status).json({ error: "Failed to send preview email", details });
    }

    return res.status(200).json({ ok: true, sentTo: subscriber.email });
  } catch (error: any) {
    console.error("send-recap-preview error", error);
    return res.status(500).json({ error: error?.message ?? "Unknown error" });
  }
}


function buildRecapPreviewEmail(data: any) {
  const currency = new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  });

  const incomes = data.incomes ?? [];
  const expenses = data.expenses ?? [];
  const savingsGoals = data.savingsGoals ?? [];
  const categories = data.categories ?? [];

  const totalIncome = incomes.reduce((sum: number, income: any) => sum + (typeof income.amount === "number" ? income.amount : 0), 0);
  const totalSpent = expenses.reduce((sum: number, expense: any) => sum + (typeof expense.amount === "number" ? expense.amount : 0), 0);
  const monthName = new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  const categoryMap = new Map(categories.map((category: any) => [category.id, category]));

  const categoryTotals = expenses.reduce((totals: Record<string, number>, expense: any) => {
    const category = categoryMap.get(expense.categoryId) as any;
    const label = (category && typeof category.name === "string") ? category.name : "Outros";
    const amt = typeof expense.amount === "number" ? expense.amount : 0;
    totals[label] = (totals[label] ?? 0) + amt;
    return totals;
  }, {});

  const topExpenses = [...expenses]
    .sort((a: any, b: any) => {
      const aAmt = typeof a.amount === "number" ? a.amount : 0;
      const bAmt = typeof b.amount === "number" ? b.amount : 0;
      return bAmt - aAmt;
    })
    .slice(0, 5);

  const goalsHtml = savingsGoals.length
    ? savingsGoals
        .map(
          (goal: any) =>
            `<li style="margin-bottom:10px;"><strong>${escapeHtml(String(goal.name ?? "-"))}</strong> — ${currency.format(
              typeof goal.currentAmount === "number" ? goal.currentAmount : 0,
            )} de ${currency.format(typeof goal.targetAmount === "number" ? goal.targetAmount : 0)}${goal.targetDate ? ` até ${new Date(goal.targetDate).toLocaleDateString("pt-PT")}` : ""}</li>`,
        )
        .join("")
    : "<p style=\"margin:0;color:#555;\">Ainda não tens objetivos de poupança definidos.</p>";

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
            .sort(([, a], [, b]) => {
              const numA = typeof a === "number" ? a : 0;
              const numB = typeof b === "number" ? b : 0;
              return numB - numA;
            })
            .map(
              ([category, amount]) =>
                `<li style="margin-bottom:6px;"><strong>${escapeHtml(String(category))}</strong>: ${currency.format(typeof amount === "number" ? amount : 0)}</li>`,
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
                (expense: any) =>
                  `<tr><td style="padding:8px 0;">${escapeHtml(expense.description ?? "-")}</td><td style="padding:8px 0; text-align:right;">${currency.format(typeof expense.amount === "number" ? expense.amount : 0)}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </section>
      <section style="margin-bottom:24px;">
        <h2 style="font-size:18px; margin-bottom:10px;">Objetivos de poupança</h2>
        ${savingsGoals.length ? `<ul style="padding-left:18px; margin:0;">${goalsHtml}</ul>` : goalsHtml}
      </section>
      <footer style="color:#777; font-size:13px;">
        <p style="margin:0;">Isto é apenas um teste de pré-visualização. O resumo mensal real será enviado no dia 1 de cada mês.</p>
      </footer>
    </div>
  `;
}

function escapeHtml(text: string) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
