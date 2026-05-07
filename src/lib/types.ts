export interface SubCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudget: number;
  subCategories?: SubCategory[];
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
  targetDate?: string; // ISO date
  fundHistory: SavingsFundEntry[];
  monthlyContribution?: number;
}

export interface AppData {
  categories: Category[];
  expenses: Expense[];
  monthlyConfigs: MonthlyConfig[];
  yearlyPlans: YearlyPlan[];
  savingsGoals: SavingsGoal[];
  monthStartDay?: number; // 1-28, day of month when budget cycle starts
  monthlyEmailReport?: {
    email: string;
    enabled: boolean;
    lastSentMonth?: string;
  };
}
