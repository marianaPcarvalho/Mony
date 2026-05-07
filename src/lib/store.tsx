import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppData, Category, Expense, MonthlyConfig, YearlyPlan, SavingsGoal, SubCategory, SavingsFundEntry, UserProfile, Investment, InvestmentTransaction, Income, IncomeCategory } from "./types";
import { useCloudSync } from "./cloudSync";

const STORAGE_KEY = "budget-app-data";

const defaultCategories: Category[] = [
  { id: "1", name: "Housing", icon: "🏠", color: "hsl(24, 80%, 48%)", monthlyBudget: 800, subCategories: [] },
  { id: "2", name: "Food", icon: "🍕", color: "hsl(var(--chart-2))", monthlyBudget: 400, subCategories: [] },
  { id: "3", name: "Transport", icon: "🚗", color: "hsl(var(--chart-3))", monthlyBudget: 200, subCategories: [] },
  { id: "4", name: "Entertainment", icon: "🎬", color: "hsl(var(--chart-4))", monthlyBudget: 150, subCategories: [] },
  { id: "5", name: "Health", icon: "💊", color: "hsl(var(--chart-5))", monthlyBudget: 100, subCategories: [] },
  { id: "6", name: "Shopping", icon: "🛍️", color: "hsl(var(--chart-6))", monthlyBudget: 200, subCategories: [] },
];

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const defaultIncomeCategories: IncomeCategory[] = [
  { id: "salary", name: "Salary", icon: "💼", color: "hsl(178, 60%, 40%)" },
  { id: "freelance", name: "Freelance", icon: "💻", color: "hsl(220, 70%, 55%)" },
  { id: "bonus", name: "Bonus", icon: "🎁", color: "hsl(38, 92%, 50%)" },
  { id: "investment", name: "Investment Return", icon: "📈", color: "hsl(142, 55%, 42%)" },
  { id: "gift", name: "Gift", icon: "🎀", color: "hsl(330, 70%, 58%)" },
  { id: "other", name: "Other", icon: "📦", color: "hsl(220, 14%, 50%)" },
];

const defaultProfile: UserProfile = {
  name: "Mariana",
  defaultSalary: 3000,
  notifications: {
    budgetAlerts: true,
    monthlySummary: true,
    savingsReminders: false,
  },
};

const defaultData: AppData = {
  categories: defaultCategories,
  incomeCategories: defaultIncomeCategories,
  expenses: [],
  monthlyConfigs: [{ month: currentMonth(), salary: 3000, budget: 1850 }],
  yearlyPlans: [],
  savingsGoals: [],
  investments: [],
  incomes: [],
  profile: defaultProfile,
};

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.monthlyConfigs) {
        parsed.monthlyConfigs = parsed.monthlyConfigs.map((mc: any) => ({
          ...mc,
          budget: mc.budget ?? 0,
        }));
      }
      if (parsed.savingsGoals) {
        parsed.savingsGoals = parsed.savingsGoals.map((sg: any) => ({
          ...sg,
          fundHistory: sg.fundHistory ?? [],
          targetDate: sg.targetDate ?? undefined,
          monthlyContribution: sg.monthlyContribution ?? undefined,
        }));
      }
      if (parsed.categories) {
        parsed.categories = parsed.categories.map((c: any) => ({
          ...c,
          subCategories: c.subCategories ?? [],
        }));
      }
      parsed.investments = (parsed.investments ?? []).map((i: any) => ({
        ...i,
        transactions: i.transactions ?? [],
      }));
      parsed.incomes = (parsed.incomes ?? []).map((i: any) => ({
        ...i,
      }));
      parsed.incomeCategories = parsed.incomeCategories ?? defaultIncomeCategories;
      parsed.profile = {
        ...defaultProfile,
        ...(parsed.profile ?? {}),
        notifications: { ...defaultProfile.notifications, ...((parsed.profile?.notifications) ?? {}) },
      };
      return parsed;
    }
  } catch {}
  return defaultData;
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface StoreContextType {
  data: AppData;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addSubCategory: (categoryId: string, sub: Omit<SubCategory, "id">) => void;
  updateSubCategory: (categoryId: string, sub: SubCategory) => void;
  deleteSubCategory: (categoryId: string, subId: string) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  setSalary: (month: string, salary: number) => void;
  getSalary: (month: string) => number;
  setBudget: (month: string, budget: number) => void;
  getBudget: (month: string) => number;
  getMonthConfig: (month: string) => MonthlyConfig;
  addYearlyPlan: (p: Omit<YearlyPlan, "id">) => void;
  updateYearlyPlan: (p: YearlyPlan) => void;
  deleteYearlyPlan: (id: string) => void;
  addSavingsGoal: (g: Omit<SavingsGoal, "id">) => void;
  updateSavingsGoal: (g: SavingsGoal) => void;
  deleteSavingsGoal: (id: string) => void;
  addFundsToGoal: (goalId: string, amount: number, note?: string) => void;
  getMonthExpenses: (month: string) => Expense[];
  getCategorySpent: (categoryId: string, month: string) => number;
  getTotalSpent: (month: string) => number;
  getTotalBudget: () => number;
  getPlannedMonthlySavings: () => number;
  getActualSavedTotal: () => number;
  getActualSavedInMonth: (month: string) => number;
  setMonthStartDay: (day: number) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  getProfile: () => UserProfile;
  addInvestment: (i: Omit<Investment, "id">) => void;
  updateInvestment: (i: Investment) => void;
  deleteInvestment: (id: string) => void;
  addInvestmentTransaction: (investmentId: string, tx: Omit<InvestmentTransaction, "id">) => void;
  deleteInvestmentTransaction: (investmentId: string, txId: string) => void;
  addIncome: (i: Omit<Income, "id">) => void;
  updateIncome: (i: Income) => void;
  deleteIncome: (id: string) => void;
  addIncomeCategory: (c: Omit<IncomeCategory, "id">) => void;
  updateIncomeCategory: (c: IncomeCategory) => void;
  deleteIncomeCategory: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  useEffect(() => { saveData(data); }, [data]);
  useCloudSync(data);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData(prev => fn(prev));
  }, []);

  const uid = () => crypto.randomUUID();

  const addCategory = (c: Omit<Category, "id">) =>
    update(d => ({ ...d, categories: [...d.categories, { ...c, id: uid(), subCategories: c.subCategories ?? [] }] }));
  const updateCategory = (c: Category) =>
    update(d => ({ ...d, categories: d.categories.map(x => x.id === c.id ? c : x) }));
  const deleteCategory = (id: string) =>
    update(d => ({ ...d, categories: d.categories.filter(x => x.id !== id) }));
  const addSubCategory = (categoryId: string, sub: Omit<SubCategory, "id">) =>
    update(d => ({
      ...d,
      categories: d.categories.map(c =>
        c.id === categoryId
          ? { ...c, subCategories: [...(c.subCategories ?? []), { ...sub, id: uid() }] }
          : c
      ),
    }));
  const updateSubCategory = (categoryId: string, sub: SubCategory) =>
    update(d => ({
      ...d,
      categories: d.categories.map(c =>
        c.id === categoryId
          ? { ...c, subCategories: (c.subCategories ?? []).map(s => s.id === sub.id ? sub : s) }
          : c
      ),
    }));
  const deleteSubCategory = (categoryId: string, subId: string) =>
    update(d => ({
      ...d,
      categories: d.categories.map(c =>
        c.id === categoryId
          ? { ...c, subCategories: (c.subCategories ?? []).filter(s => s.id !== subId) }
          : c
      ),
    }));

  const addExpense = (e: Omit<Expense, "id">) =>
    update(d => ({ ...d, expenses: [...d.expenses, { ...e, id: uid() }] }));
  const updateExpense = (e: Expense) =>
    update(d => ({ ...d, expenses: d.expenses.map(x => x.id === e.id ? e : x) }));
  const deleteExpense = (id: string) =>
    update(d => ({ ...d, expenses: d.expenses.filter(x => x.id !== id) }));

  const getMonthConfig = (month: string): MonthlyConfig =>
    data.monthlyConfigs.find(m => m.month === month) ?? { month, salary: 0, budget: 0 };
  const setSalary = (month: string, salary: number) =>
    update(d => {
      const existing = d.monthlyConfigs.find(m => m.month === month);
      if (existing) return { ...d, monthlyConfigs: d.monthlyConfigs.map(m => m.month === month ? { ...m, salary } : m) };
      return { ...d, monthlyConfigs: [...d.monthlyConfigs, { month, salary, budget: 0 }] };
    });
  const getProfile = (): UserProfile => data.profile ?? defaultProfile;
  const getSalary = (month: string) => {
    const cfg = data.monthlyConfigs.find(m => m.month === month);
    if (cfg) return cfg.salary;
    return getProfile().defaultSalary;
  };
  const updateProfile = (p: Partial<UserProfile>) =>
    update(d => ({
      ...d,
      profile: {
        ...(d.profile ?? defaultProfile),
        ...p,
        notifications: { ...(d.profile?.notifications ?? defaultProfile.notifications), ...(p.notifications ?? {}) },
      },
    }));
  const setBudget = (month: string, budget: number) =>
    update(d => {
      const existing = d.monthlyConfigs.find(m => m.month === month);
      if (existing) return { ...d, monthlyConfigs: d.monthlyConfigs.map(m => m.month === month ? { ...m, budget } : m) };
      return { ...d, monthlyConfigs: [...d.monthlyConfigs, { month, salary: 0, budget }] };
    });
  const getBudget = (month: string) => getMonthConfig(month).budget;

  const addYearlyPlan = (p: Omit<YearlyPlan, "id">) =>
    update(d => ({ ...d, yearlyPlans: [...d.yearlyPlans, { ...p, id: uid() }] }));
  const updateYearlyPlan = (p: YearlyPlan) =>
    update(d => ({ ...d, yearlyPlans: d.yearlyPlans.map(x => x.id === p.id ? p : x) }));
  const deleteYearlyPlan = (id: string) =>
    update(d => ({ ...d, yearlyPlans: d.yearlyPlans.filter(x => x.id !== id) }));

  const addSavingsGoal = (g: Omit<SavingsGoal, "id">) =>
    update(d => ({ ...d, savingsGoals: [...d.savingsGoals, { ...g, id: uid(), fundHistory: g.fundHistory ?? [] }] }));
  const updateSavingsGoal = (g: SavingsGoal) =>
    update(d => ({ ...d, savingsGoals: d.savingsGoals.map(x => x.id === g.id ? g : x) }));
  const deleteSavingsGoal = (id: string) =>
    update(d => ({ ...d, savingsGoals: d.savingsGoals.filter(x => x.id !== id) }));
  const addFundsToGoal = (goalId: string, amount: number, note?: string) =>
    update(d => ({
      ...d,
      savingsGoals: d.savingsGoals.map(g =>
        g.id === goalId
          ? {
              ...g,
              currentAmount: g.currentAmount + amount,
              fundHistory: [...(g.fundHistory ?? []), { id: uid(), amount, date: new Date().toISOString(), note }],
            }
          : g
      ),
    }));

  const setMonthStartDay = (day: number) =>
    update(d => ({ ...d, monthStartDay: day }));

  const addInvestment = (i: Omit<Investment, "id">) =>
    update(d => ({ ...d, investments: [...(d.investments ?? []), { ...i, id: uid(), transactions: i.transactions ?? [] }] }));
  const updateInvestment = (i: Investment) =>
    update(d => ({ ...d, investments: (d.investments ?? []).map(x => x.id === i.id ? i : x) }));
  const deleteInvestment = (id: string) =>
    update(d => ({ ...d, investments: (d.investments ?? []).filter(x => x.id !== id) }));
  const addInvestmentTransaction = (investmentId: string, tx: Omit<InvestmentTransaction, "id">) =>
    update(d => ({
      ...d,
      investments: (d.investments ?? []).map(inv => {
        if (inv.id !== investmentId) return inv;
        const newTx = { ...tx, id: uid() };
        let units = inv.units;
        let avgCost = inv.avgCost;
        if (tx.type === "buy" && tx.units && tx.pricePerUnit) {
          const newUnits = units + tx.units;
          avgCost = newUnits > 0 ? (units * avgCost + tx.units * tx.pricePerUnit) / newUnits : 0;
          units = newUnits;
        } else if (tx.type === "sell" && tx.units) {
          units = Math.max(0, units - tx.units);
          if (units === 0) avgCost = 0;
        }
        return { ...inv, units, avgCost, transactions: [...(inv.transactions ?? []), newTx] };
      }),
    }));
  const deleteInvestmentTransaction = (investmentId: string, txId: string) =>
    update(d => ({
      ...d,
      investments: (d.investments ?? []).map(inv =>
        inv.id === investmentId
          ? { ...inv, transactions: (inv.transactions ?? []).filter(t => t.id !== txId) }
          : inv
      ),
    }));

  const addIncome = (i: Omit<Income, "id">) =>
    update(d => ({ ...d, incomes: [...(d.incomes ?? []), { ...i, id: uid() }] }));
  const updateIncome = (i: Income) =>
    update(d => ({ ...d, incomes: (d.incomes ?? []).map(x => x.id === i.id ? i : x) }));
  const deleteIncome = (id: string) =>
    update(d => ({ ...d, incomes: (d.incomes ?? []).filter(x => x.id !== id) }));

  const addIncomeCategory = (c: Omit<IncomeCategory, "id">) =>
    update(d => ({ ...d, incomeCategories: [...(d.incomeCategories ?? []), { ...c, id: uid() }] }));
  const updateIncomeCategory = (c: IncomeCategory) =>
    update(d => ({ ...d, incomeCategories: (d.incomeCategories ?? []).map(x => x.id === c.id ? c : x) }));
  const deleteIncomeCategory = (id: string) =>
    update(d => ({ ...d, incomeCategories: (d.incomeCategories ?? []).filter(x => x.id !== id) }));

  const monthStartDay = data.monthStartDay ?? 1;

  const getMonthExpenses = (month: string) => {
    if (monthStartDay === 1) {
      return data.expenses.filter(e => e.date.startsWith(month));
    }
    // Custom start day: month "2026-03" with startDay 25 means 2026-02-25 to 2026-03-24
    const [year, mon] = month.split("-").map(Number);
    const startDate = new Date(year, mon - 2, monthStartDay); // previous month's startDay
    const endDate = new Date(year, mon - 1, monthStartDay - 1, 23, 59, 59); // current month's startDay - 1
    return data.expenses.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });
  };

  const getCategorySpent = (categoryId: string, month: string) =>
    getMonthExpenses(month).filter(e => e.categoryId === categoryId).reduce((s, e) => s + e.amount, 0);
  const getTotalSpent = (month: string) =>
    getMonthExpenses(month).reduce((s, e) => s + e.amount, 0);
  const getTotalBudget = () =>
    data.categories.reduce((s, c) => s + c.monthlyBudget, 0);
  
  const getPlannedMonthlySavings = () =>
    data.savingsGoals.reduce((s, g) => s + (g.monthlyContribution ?? 0), 0);
  
  const getActualSavedTotal = () =>
    data.savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  
  const getActualSavedInMonth = (month: string) =>
    data.savingsGoals.reduce((s, g) => {
      const monthFunds = (g.fundHistory ?? []).filter(f => f.date.startsWith(month));
      return s + monthFunds.reduce((fs, f) => fs + f.amount, 0);
    }, 0);

  return (
    <StoreContext.Provider value={{
      data, selectedMonth, setSelectedMonth,
      addCategory, updateCategory, deleteCategory, addSubCategory, updateSubCategory, deleteSubCategory,
      addExpense, updateExpense, deleteExpense,
      setSalary, getSalary, setBudget, getBudget, getMonthConfig,
      addYearlyPlan, updateYearlyPlan, deleteYearlyPlan,
      addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addFundsToGoal,
      getMonthExpenses, getCategorySpent, getTotalSpent, getTotalBudget,
      getPlannedMonthlySavings, getActualSavedTotal, getActualSavedInMonth,
      setMonthStartDay, updateProfile, getProfile,
      addInvestment, updateInvestment, deleteInvestment, addInvestmentTransaction, deleteInvestmentTransaction,
      addIncome, updateIncome, deleteIncome,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
