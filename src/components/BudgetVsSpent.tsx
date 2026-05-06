import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export function BudgetVsSpent() {
  const { data, selectedMonth, getCategorySpent } = useStore();

  const barData = data.categories.map(c => ({
    name: c.name,
    spent: getCategorySpent(c.id, selectedMonth),
    budget: c.monthlyBudget,
  }));

  return (
    <Card className="glass-card p-5">
      <h4 className="text-sm font-medium text-foreground mb-4">Budget vs Spent</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 82%)" opacity={0.5} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(220, 12%, 35%)" }} tickFormatter={(v) => `€${v}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 12%, 35%)" }} width={80} />
          <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="budget" fill="hsl(220, 55%, 65%)" radius={[0, 4, 4, 0]} barSize={12} name="Budget" />
          <Bar dataKey="spent" fill="hsl(0, 65%, 52%)" radius={[0, 4, 4, 0]} barSize={12} name="Spent" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
