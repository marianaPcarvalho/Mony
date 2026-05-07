export interface SubCategory {
  id: string;
  name: string;
  icon: string;
  color?: string; // tailwind/HSL color token
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudget: number;
  subCategories?: SubCategory[];
  recurring?: boolean; // expenses recur every month (e.g. rent, subscriptions)
}

export interface Expense {
  id: string;
  categoryId: string;
  subCategoryId?: string;
  amount: number;
  description: string;
  date: string; // ISO string
}

export interface MonthlyConfig {
  month: string; // "YYYY-MM"
  salary: number;
  budget: number; // separate monthly budget cap
}

export interface YearlyPlan {
  id: string;
  name: string;
  month: number; // 0-11
  amount: number;
  categoryId?: string;
}

export interface SavingsFundEntry {
  id: string;
  amount: number;
  date: string; // ISO string
  note?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  imageUrl?: string; // optional photo for the goal (data URL)
  targetDate?: string; // ISO date
  fundHistory: SavingsFundEntry[];
  monthlyContribution?: number;
}

export interface IncomeCategory {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  type: string; // IncomeCategory id (legacy values like "salary","bonus" still work via seed mapping)
  date: string; // ISO string
}

export interface UserProfile {
  name: string;
  defaultSalary: number;
  notifications: {
    budgetAlerts: boolean;
    monthlySummary: boolean;
    savingsReminders: boolean;
  };
}

export interface InvestmentTransaction {
  id: string;
  type: "buy" | "sell" | "dividend";
  date: string; // ISO
  units?: number;
  pricePerUnit?: number;
  amount: number; // total cash flow (positive)
  note?: string;
}

export interface Investment {
  id: string;
  name: string;
  symbol?: string;
  type: "stock" | "etf" | "crypto" | "fund" | "bond" | "other";
  icon: string;
  units: number;
  avgCost: number; // average cost per unit
  currentPrice: number;
  currency?: string;
  transactions: InvestmentTransaction[];
}

export interface AppData {
  categories: Category[];
  incomeCategories?: IncomeCategory[];
  expenses: Expense[];
  monthlyConfigs: MonthlyConfig[];
  yearlyPlans: YearlyPlan[];
  savingsGoals: SavingsGoal[];
  investments?: Investment[];
  incomes?: Income[];
  monthStartDay?: number;
  profile?: UserProfile;
}
