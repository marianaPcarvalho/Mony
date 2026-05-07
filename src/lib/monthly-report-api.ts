import { MonthlyReportPayload } from "@/lib/monthly-report";

export async function sendMonthlyReportEmail(to: string, report: MonthlyReportPayload): Promise<void> {
  const response = await fetch("/api/monthly-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      report,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Could not send monthly report email.");
  }
}
