import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildRecapPreviewEmail(data: any, subscriberEmail: string): string {
  const currency = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  });

  // Calculate totals
  const totalIncome = data.months?.[data.currentMonth]?.income || 0;
  const totalSpent = data.months?.[data.currentMonth]?.expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0;

  // Group expenses by category
  const categoryTotals: Record<string, number> = {};
  data.months?.[data.currentMonth]?.expenses?.forEach((exp: any) => {
    const category = exp.category || 'Outros';
    categoryTotals[category] = (categoryTotals[category] || 0) + (exp.amount || 0);
  });

  // Get top 5 expenses
  const topExpenses = data.months?.[data.currentMonth]?.expenses
    ?.sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0))
    ?.slice(0, 5) || [];

  // Get savings goals
  const savingsGoals = data.savingsGoals || [];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumo Mensal - MONY</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">MONY</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Resumo mensal do teu orçamento</p>
    </div>

    <div style="padding: 32px 24px;">
      <section style="margin-bottom:24px;">
        <h2 style="font-size:18px; margin-bottom:12px; color: #1e293b;">Resumo financeiro</h2>
        <p style="margin:0.25rem 0;"><strong>Recebido:</strong> ${currency.format(totalIncome)}</p>
        <p style="margin:0.25rem 0;"><strong>Gasto:</strong> ${currency.format(totalSpent)}</p>
        <p style="margin:0.25rem 0;"><strong>Saldo líquido:</strong> ${currency.format(totalIncome - totalSpent)}</p>
      </section>

      <section style="margin-bottom:24px;">
        <h2 style="font-size:18px; margin-bottom:10px; color: #1e293b;">Despesas por categoria</h2>
        <ul style="padding-left:18px; margin:0;">
          ${Object.entries(categoryTotals)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([category, amount]) => `<li style="margin-bottom:6px;"><strong>${escapeHtml(category)}</strong>: ${currency.format(amount as number)}</li>`)
            .join('')}
        </ul>
      </section>

      ${topExpenses.length > 0 ? `
      <section style="margin-bottom:24px;">
        <h2 style="font-size:18px; margin-bottom:10px; color: #1e293b;">Top 5 despesas</h2>
        <table style="width:100%; border-collapse:collapse; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:8px 12px; text-align:left; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">Descrição</th>
              <th style="padding:8px 12px; text-align:left; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">Categoria</th>
              <th style="padding:8px 12px; text-align:right; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${topExpenses.map((exp: any) => `
              <tr>
                <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#475569;">${escapeHtml(exp.description || '-')}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#475569;">${escapeHtml(exp.category || 'Outros')}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#475569; text-align:right; font-weight:500;">${currency.format(exp.amount || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      ` : ''}

      ${savingsGoals.length > 0 ? `
      <section style="margin-bottom:24px;">
        <h2 style="font-size:18px; margin-bottom:10px; color: #1e293b;">Objetivos de poupança</h2>
        <div style="display:grid; gap:12px;">
          ${savingsGoals.map((goal: any) => `
            <div style="padding:16px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h3 style="margin:0; font-size:16px; font-weight:600; color:#1e293b;">${escapeHtml(goal.name || 'Objetivo')}</h3>
                <span style="font-size:14px; color:#64748b;">${Math.round(((goal.current || 0) / (goal.target || 1)) * 100)}% completo</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px; color:#64748b;">${currency.format(goal.current || 0)} de ${currency.format(goal.target || 0)}</span>
                <div style="width:100px; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden; margin-left:12px;">
                  <div style="width:${Math.min(100, ((goal.current || 0) / (goal.target || 1)) * 100)}%; height:100%; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius:3px;"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

      <div style="margin-top:32px; padding-top:24px; border-top:1px solid #e2e8f0; text-align:center;">
        <p style="margin:0; font-size:14px; color:#64748b;">Este resumo foi gerado automaticamente pelo MONY</p>
        <p style="margin:8px 0 0 0; font-size:12px; color:#94a3b8;">Se não quiseres receber estes emails, podes cancelar a subscrição no teu perfil.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deviceToken } = req.body;

    if (!deviceToken || typeof deviceToken !== 'string') {
      return res.status(400).json({ error: 'Device token is required' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(deviceToken)) {
      return res.status(400).json({ error: 'Invalid device token format' });
    }

    // Get subscriber info
    const { data: subscriber, error: subError } = await supabase
      .from('recap_subscribers')
      .select('email, enabled')
      .eq('device_token', deviceToken)
      .single();

    if (subError || !subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    if (!subscriber.enabled) {
      return res.status(400).json({ error: 'Subscription is disabled' });
    }

    // Get user data
    const { data: snapshot, error: snapError } = await supabase
      .from('cloud_snapshots')
      .select('data')
      .eq('device_token', deviceToken)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (snapError || !snapshot) {
      return res.status(404).json({ error: 'No data found for this device' });
    }

    // Generate email HTML
    const emailHtml = buildRecapPreviewEmail(snapshot.data, subscriber.email);

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: subscriber.email,
      subject: 'Resumo mensal - MONY',
      html: emailHtml,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}