import { useState } from "react";
import { StoreProvider } from "@/lib/store";
import { HomeHero } from "@/components/HomeHero";
import { CategoryBudgets } from "@/components/CategoryBudgets";

import { ExpenseList } from "@/components/ExpenseList";
import { BudgetVsSpent } from "@/components/BudgetVsSpent";
import { SavingsGoals } from "@/components/SavingsGoals";
import { AnnualDashboard } from "@/components/AnnualDashboard";
import { ProfilePage } from "@/components/ProfilePage";
import { MonthSelector } from "@/components/MonthSelector";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, ViewKey } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [view, setView] = useState<ViewKey>("home");

  return (
    <StoreProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar active={view} onSelect={setView} />
          <SidebarInset>
            <header className="h-14 flex items-center gap-3 border-b border-border bg-card sticky top-0 z-10 px-4">
              <SidebarTrigger />
              <div className="flex-1" />
              {view === "home" && <MonthSelector />}
            </header>

            <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
              {view === "home" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                  <div className="lg:col-span-2 space-y-6">
                    <HomeHero />
                    <BudgetVsSpent />
                  </div>
                  <div className="lg:col-span-3">
                    <ExpenseList />
                  </div>
                </div>
              )}

              {view === "categories" && <CategoryBudgets />}

              {view === "savings" && <SavingsGoals />}

              {view === "investments" && (
                <Card className="glass-card p-10 text-center space-y-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Investments</h2>
                  <p className="text-sm text-muted-foreground">Coming soon — track your investment portfolio here.</p>
                </Card>
              )}

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
