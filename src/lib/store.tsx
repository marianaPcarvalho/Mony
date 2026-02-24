import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppData, Category, Expense, MonthlyConfig, YearlyPlan, SavingsGoal } from "./types";

const STORAGE_KEY = "budget-app-data";

const defaultCategories: Category[] = [
  { id: "1", name: "Housing", icon: "🏠", color: "hsl(var(--chart-1))", monthlyBudget: 800 },
  { id: "2", name: "Food", icon: "🍕", color: "hsl(var(--chart-2))", monthlyBudget: 400 },
  { id: "3", name: "Transport", icon: "🚗", color: "hsl(var(--chart-3))", monthlyBudget: 200 },
  { id: "4", name: "Entertainment", icon: "🎬", color: "hsl(var(--chart-4))", monthlyBudget: 150 },
  { id: "5", name: "Health", icon: "💊", color: "hsl(var(--chart-5))", monthlyBudget: 100 },
  { id: "6", name: "Shopping", icon: "🛍️", color: "hsl(var(--chart-6))", monthlyBudget: 200 },
];

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const defaultData: AppData = {
  categories: defaultCategories,
  expenses: [],
  monthlyConfigs: [{ month: currentMonth(), salary: 3000 }],
  yearlyPlans: [],
  savingsGoals: [],
};

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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
  addExpense: (e: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  setSalary: (month: string, salary: number) => void;
  getSalary: (month: string) => number;
  addYearlyPlan: (p: Omit<YearlyPlan, "id">) => void;
  deleteYearlyPlan: (id: string) => void;
  addSavingsGoal: (g: Omit<SavingsGoal, "id">) => void;
  updateSavingsGoal: (g: SavingsGoal) => void;
  deleteSavingsGoal: (id: string) => void;
  getMonthExpenses: (month: string) => Expense[];
  getCategorySpent: (categoryId: string, month: string) => number;
  getTotalSpent: (month: string) => number;
  getTotalBudget: () => number;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  useEffect(() => { saveData(data); }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData(prev => fn(prev));
  }, []);

  const uid = () => crypto.randomUUID();

  const addCategory = (c: Omit<Category, "id">) =>
    update(d => ({ ...d, categories: [...d.categories, { ...c, id: uid() }] }));
  const updateCategory = (c: Category) =>
    update(d => ({ ...d, categories: d.categories.map(x => x.id === c.id ? c : x) }));
  const deleteCategory = (id: string) =>
    update(d => ({ ...d, categories: d.categories.filter(x => x.id !== id) }));

  const addExpense = (e: Omit<Expense, "id">) =>
    update(d => ({ ...d, expenses: [...d.expenses, { ...e, id: uid() }] }));
  const deleteExpense = (id: string) =>
    update(d => ({ ...d, expenses: d.expenses.filter(x => x.id !== id) }));

  const setSalary = (month: string, salary: number) =>
    update(d => {
      const existing = d.monthlyConfigs.find(m => m.month === month);
      if (existing) return { ...d, monthlyConfigs: d.monthlyConfigs.map(m => m.month === month ? { ...m, salary } : m) };
      return { ...d, monthlyConfigs: [...d.monthlyConfigs, { month, salary }] };
    });
  const getSalary = (month: string) =>
    data.monthlyConfigs.find(m => m.month === month)?.salary ?? 0;

  const addYearlyPlan = (p: Omit<YearlyPlan, "id">) =>
    update(d => ({ ...d, yearlyPlans: [...d.yearlyPlans, { ...p, id: uid() }] }));
  const deleteYearlyPlan = (id: string) =>
    update(d => ({ ...d, yearlyPlans: d.yearlyPlans.filter(x => x.id !== id) }));

  const addSavingsGoal = (g: Omit<SavingsGoal, "id">) =>
    update(d => ({ ...d, savingsGoals: [...d.savingsGoals, { ...g, id: uid() }] }));
  const updateSavingsGoal = (g: SavingsGoal) =>
    update(d => ({ ...d, savingsGoals: d.savingsGoals.map(x => x.id === g.id ? g : x) }));
  const deleteSavingsGoal = (id: string) =>
    update(d => ({ ...d, savingsGoals: d.savingsGoals.filter(x => x.id !== id) }));

  const getMonthExpenses = (month: string) =>
    data.expenses.filter(e => e.date.startsWith(month));
  const getCategorySpent = (categoryId: string, month: string) =>
    getMonthExpenses(month).filter(e => e.categoryId === categoryId).reduce((s, e) => s + e.amount, 0);
  const getTotalSpent = (month: string) =>
    getMonthExpenses(month).reduce((s, e) => s + e.amount, 0);
  const getTotalBudget = () =>
    data.categories.reduce((s, c) => s + c.monthlyBudget, 0);

  return (
    <StoreContext.Provider value={{
      data, selectedMonth, setSelectedMonth,
      addCategory, updateCategory, deleteCategory,
      addExpense, deleteExpense,
      setSalary, getSalary,
      addYearlyPlan, deleteYearlyPlan,
      addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
      getMonthExpenses, getCategorySpent, getTotalSpent, getTotalBudget,
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
