import { useState, useEffect } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { HomeHero } from "@/components/HomeHero";
import { CategoryBudgets } from "@/components/CategoryBudgets";

import { ExpenseList } from "@/components/ExpenseList";
import { IncomeList } from "@/components/IncomeList";
import { BankStatementImport, hasAnyImport } from "@/components/BankStatementImport";
import { BudgetVsSpent } from "@/components/BudgetVsSpent";
import { SavingsGoals } from "@/components/SavingsGoals";
import { Investments } from "@/components/Investments";
import { AnnualDashboard } from "@/components/AnnualDashboard";
import { ProfilePage } from "@/components/ProfilePage";
import { MonthSelector } from "@/components/MonthSelector";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, ViewKey } from "@/components/AppSidebar";

const currentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function HomeView() {
  const { setSelectedMonth } = useStore();
  // Always reset to the current calendar month when entering Home.
  useEffect(() => {
    setSelectedMonth(currentMonthStr());
  }, [setSelectedMonth]);

  const showImportCard = !hasAnyImport();

  return (
    <>
      {showImportCard && <BankStatementImport />}
      <HomeHero />
      <section aria-labelledby="month-details-heading" className="space-y-5 pt-2">
        <h2 id="month-details-heading" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Atividade deste mês
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <IncomeList />
          <ExpenseList />
        </div>
        <BudgetVsSpent />
      </section>
    </>
  );
}

const Index = () => {
  const [view, setView] = useState<ViewKey>("home");

  return (
    <StoreProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar active={view} onSelect={setView} />
          <SidebarInset>
            <header className="h-14 flex items-center gap-2 sm:gap-3 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-10 px-3 sm:px-4">
              <SidebarTrigger />
              <div className="flex-1" />
              {view === "home" && <MonthSelector />}
            </header>

            <main className="container max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
              {view === "home" && <HomeView />}
              {view === "categories" && <CategoryBudgets />}
              {view === "savings" && <SavingsGoals />}
              {view === "investments" && <Investments />}
              {view === "annual" && <AnnualDashboard />}
              {view === "profile" && <ProfilePage />}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </StoreProvider>
  );
};

export default Index;
