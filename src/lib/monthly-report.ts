import { AppData } from "@/lib/types";

export interface MonthlyReportPayload {
  month: string;
  salary: number;
  spent: number;
  remaining: number;
  categories: Array<{ name: string; spent: number }>;
}

function getMonthExpenses(data: AppData, month: string): Array<{ categoryId: string; amount: number; date: string }> {
  const monthStartDay = data.monthStartDay ?? 1;

  if (monthStartDay === 1) {
    return data.expenses.filter((e) => e.date.startsWith(month));
  }

  const [year, mon] = month.split("-").map(Number);
  const startDate = new Date(year, mon - 2, monthStartDay);
  const endDate = new Date(year, mon - 1, monthStartDay - 1, 23, 59, 59);

  return data.expenses.filter((e) => {
    const d = new Date(e.date);
    return d >= startDate && d <= endDate;
  });
}

export function buildMonthlyReport(data: AppData, month: string): MonthlyReportPayload {
  const expenses = getMonthExpenses(data, month);
  const config = data.monthlyConfigs.find((m) => m.month === month);
  const salary = config?.salary ?? 0;
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categories = data.categories
    .map((category) => {
      const categorySpent = expenses
        .filter((e) => e.categoryId === category.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return { name: category.name, spent: categorySpent };
    })
    .filter((entry) => entry.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  return {
    month,
    salary,
    spent,
    remaining: salary - spent,
    categories,
  };
}

export function previousMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const d = new Date(year, mon - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
