import { StoreProvider } from "@/lib/store";
import { MonthSelector } from "@/components/MonthSelector";
import { SalaryInput } from "@/components/SalaryInput";
import { OverviewCards } from "@/components/OverviewCards";
import { CategoryBudgets } from "@/components/CategoryBudgets";
import { BudgetCharts } from "@/components/BudgetCharts";
import { ExpenseList } from "@/components/ExpenseList";
import { CategoryManager } from "@/components/CategoryManager";
import { SavingsGoals } from "@/components/SavingsGoals";
import { YearlyPlanner } from "@/components/YearlyPlanner";
import { AnnualDashboard } from "@/components/AnnualDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Calendar, PiggyBank, Settings2, BarChart3 } from "lucide-react";

const Index = () => {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg budget-gradient flex items-center justify-center" aria-hidden="true">
                <span className="text-sm">💰</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">BudgetFlow</h1>
            </div>
            <div className="flex items-center gap-3">
              <SalaryInput />
              <MonthSelector />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container max-w-6xl mx-auto px-4 py-6">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="annual" className="gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" /> Annual
              </TabsTrigger>
              <TabsTrigger value="yearly" className="gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" /> Yearly Plan
              </TabsTrigger>
              <TabsTrigger value="savings" className="gap-1.5 text-xs">
                <PiggyBank className="h-3.5 w-3.5" /> Savings
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs">
                <Settings2 className="h-3.5 w-3.5" /> Categories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <OverviewCards />
              <BudgetCharts />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ExpenseList />
                <CategoryBudgets />
              </div>
            </TabsContent>

            <TabsContent value="annual">
              <AnnualDashboard />
            </TabsContent>

            <TabsContent value="yearly">
              <YearlyPlanner />
            </TabsContent>

            <TabsContent value="savings">
              <SavingsGoals />
            </TabsContent>

            <TabsContent value="settings">
              <CategoryManager />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </StoreProvider>
  );
};

export default Index;
