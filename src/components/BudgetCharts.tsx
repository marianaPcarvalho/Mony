import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = [
  "hsl(168, 60%, 42%)",
  "hsl(220, 60%, 55%)",
  "hsl(36, 90%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(270, 50%, 55%)",
  "hsl(16, 80%, 55%)",
];

export function BudgetCharts() {
  const { data, selectedMonth, getCategorySpent } = useStore();

  const pieData = data.categories
    .map((c, i) => ({
      name: c.name,
      value: getCategorySpent(c.id, selectedMonth),
      color: COLORS[i % COLORS.length],
    }))
    .filter(d => d.value > 0);

  const barData = data.categories.map((c, i) => ({
    name: c.name,
    spent: getCategorySpent(c.id, selectedMonth),
    budget: c.monthlyBudget,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="glass-card p-5">
        <h3 className="section-title mb-4">Spending Distribution</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3} strokeWidth={0}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No spending data yet</div>
        )}
        <div className="flex flex-wrap gap-3 mt-2 justify-center">
          {pieData.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              <span>{d.name}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-card p-5">
        <h3 className="section-title mb-4">Budget vs Spent</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" opacity={0.3} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
            <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
            <Bar dataKey="budget" fill="hsl(220, 15%, 85%)" radius={[0, 4, 4, 0]} barSize={14} name="Budget" />
            <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={14} name="Spent">
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
