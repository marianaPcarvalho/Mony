export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudget: number;
}

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string; // ISO string
}

export interface MonthlyConfig {
  month: string; // "YYYY-MM"
  salary: number;
}

export interface YearlyPlan {
  id: string;
  name: string;
  month: number; // 0-11
  amount: number;
  categoryId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
}

export interface AppData {
  categories: Category[];
  expenses: Expense[];
  monthlyConfigs: MonthlyConfig[];
  yearlyPlans: YearlyPlan[];
  savingsGoals: SavingsGoal[];
}
