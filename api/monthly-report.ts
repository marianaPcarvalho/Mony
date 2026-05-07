import { Resend } from "resend";

interface MonthlyReportPayload {
  month: string;
  salary: number;
  spent: number;
  remaining: number;
  categories: Array<{ name: string; spent: number }>;
}

interface RequestBody {
  to?: string;
  report?: MonthlyReportPayload;
}

function formatCurrency(value: number): string {
  return `EUR ${value.toFixed(2)}`;
}

function buildHtml(report: MonthlyReportPayload): string {
  const categoriesHtml = report.categories.length
    ? report.categories
        .slice(0, 8)
        .map((item) => `<li>${item.name}: <strong>${formatCurrency(item.spent)}</strong></li>`)
        .join("")
    : "<li>No category spending registered.</li>";

  return `
    <h2>Monthly Report - ${report.month}</h2>
    <p>Here is your monthly financial summary:</p>
    <ul>
      <li>Total Income: <strong>${formatCurrency(report.salary)}</strong></li>
      <li>Total Spent: <strong>${formatCurrency(report.spent)}</strong></li>
      <li>Remaining: <strong>${formatCurrency(report.remaining)}</strong></li>
    </ul>
    <h3>Top categories</h3>
    <ul>${categoriesHtml}</ul>
  `;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return res.status(500).send("Server is missing RESEND_API_KEY.");
  }

  const body = req.body as RequestBody;
  if (!body?.to || !body?.report?.month) {
    return res.status(400).send("Missing required payload.");
  }

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: body.to,
    subject: `Your monthly report - ${body.report.month}`,
    html: buildHtml(body.report),
  });

  if (error) {
    return res.status(500).send(error.message || "Failed to send monthly report.");
  }

  return res.status(200).json({ ok: true });
}
