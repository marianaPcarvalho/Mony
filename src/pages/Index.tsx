import { useState } from "react";
import { StoreProvider } from "@/lib/store";
import { OverviewCards } from "@/components/OverviewCards";
import { CategoryBudgets } from "@/components/CategoryBudgets";
import { BudgetCharts } from "@/components/BudgetCharts";
import { ExpenseList } from "@/components/ExpenseList";
import { SavingsGoals } from "@/components/SavingsGoals";
import { YearlyPlanner } from "@/components/YearlyPlanner";
import { AnnualDashboard } from "@/components/AnnualDashboard";
import { MonthSelector } from "@/components/MonthSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, PiggyBank } from "lucide-react";

const Index = () => {
  const [dashView, setDashView] = useState<"month" | "year">("month");

  return (
    <StoreProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg budget-gradient flex items-center justify-center" aria-hidden="true">
                <span className="text-sm">💰</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">BudgetFlow</h1>
            </div>
          </div>
        </header>

        <main className="container max-w-6xl mx-auto px-4 py-6">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="yearly" className="gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" /> Yearly Plan
              </TabsTrigger>
              <TabsTrigger value="savings" className="gap-1.5 text-xs" data-value="savings">
                <PiggyBank className="h-3.5 w-3.5" /> Savings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              {/* View toggle + month selector row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => setDashView("month")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${dashView === "month" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setDashView("year")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${dashView === "year" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
                    >
                      Annual
                    </button>
                  </div>
                </div>
                {dashView === "month" && <MonthSelector />}
              </div>

              {dashView === "month" ? (
                <>
                  <OverviewCards />
                  <ExpenseList />
                  <BudgetCharts />
                  <CategoryBudgets />
                </>
              ) : (
                <AnnualDashboard />
              )}
            </TabsContent>

            <TabsContent value="yearly">
              <YearlyPlanner />
            </TabsContent>

            <TabsContent value="savings">
              <SavingsGoals />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </StoreProvider>
  );
};

export default Index;
