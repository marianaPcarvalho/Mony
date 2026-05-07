import { useStore } from "@/lib/store";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingDown, PiggyBank, Wallet } from "lucide-react";
import { buildCategoryPalette } from "@/lib/colors";

const PT_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function HomeHero() {
  const { data, selectedMonth, getCategorySpent, getSalary, getTotalSpent, getActualSavedTotal } = useStore();

  const [selYear, selMon] = selectedMonth.split("-").map(Number);
  const ptMonthName = PT_MONTHS[(selMon - 1) % 12] ?? "";
  const ptYear = selYear;

  const salary = getSalary(selectedMonth);
  const spent = getTotalSpent(selectedMonth);
  const current = salary - spent;

  const palette = buildCategoryPalette(data.categories.length);
  const pieData = data.categories
    .map((c, i) => ({
      name: c.name,
      icon: c.icon,
      value: getCategorySpent(c.id, selectedMonth),
      color: palette[i] ?? `hsl(${(i * 53) % 360}, 70%, 52%)`,
    }))
    .filter(d => d.value > 0);

  const fmt = (v: number) => `€${v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const savings = getActualSavedTotal();
  const stats = [
    { label: "Atual", value: fmt(current), icon: Wallet, tone: current >= 0 ? "success" : "destructive" as const },
    { label: "Total gasto", value: fmt(spent), icon: TrendingDown, tone: "destructive" as const },
    { label: "Poupanças atuais", value: fmt(savings), icon: PiggyBank, tone: "success" as const },
  ];

  const total = pieData.reduce((s, p) => s + p.value, 0);
  const top = pieData.slice().sort((a, b) => b.value - a.value)[0];
  const chartSummary = pieData.length === 0
    ? "Sem despesas registadas neste mês."
    : `Gastaste ${fmt(spent)} em ${pieData.length} categori${pieData.length === 1 ? "a" : "as"}. ` +
      (top ? `Maior: ${top.name} com ${fmt(top.value)} (${((top.value / total) * 100).toFixed(0)}%).` : "");

  return (
    <section aria-labelledby="month-heading" className="space-y-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 id="month-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground capitalize">
          {ptMonthName}
          <span className="text-muted-foreground font-medium ml-2 text-base sm:text-lg">{ptYear}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Donut + breakdown */}
        <div className="space-y-3">
          <div
            className="relative"
            role="img"
            aria-label={`Spending donut chart. ${chartSummary}`}
          >
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius="58%" outerRadius="88%"
                      dataKey="value" paddingAngle={1}
                      stroke="hsl(var(--card))" strokeWidth={2}
                      isAnimationActive={false}
                      style={{ pointerEvents: "none", outline: "none" }}
                    >
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} style={{ outline: "none" }} />)}
                    </Pie>
                    <Tooltip
                      wrapperStyle={{ outline: "none", fontSize: 12 }}
                      contentStyle={{
                        padding: "6px 10px", borderRadius: 8, fontSize: 12,
                        background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))",
                        border: "1px solid hsl(var(--border))",
                      }}
                      formatter={(value: number, _name, item: any) => {
                        const pct = total > 0 ? (value / total) * 100 : 0;
                        return [`€${value.toFixed(2)} (${pct.toFixed(1)}%)`, item?.payload?.name];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ height: 260 }}>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Gasto</span>
                  <span className="font-mono font-bold text-xl text-foreground">{fmt(spent)}</span>
                </div>
                {/* Screen-reader-only data table for chart accessibility */}
                <table className="sr-only">
                  <caption>Despesas por categoria — {ptMonthName} {ptYear}</caption>
                  <thead>
                    <tr><th scope="col">Categoria</th><th scope="col">Valor</th><th scope="col">Percentagem</th></tr>
                  </thead>
                  <tbody>
                    {pieData.map((d, i) => {
                      const pct = total > 0 ? (d.value / total) * 100 : 0;
                      return (
                        <tr key={i}>
                          <th scope="row">{d.name}</th>
                          <td>{fmt(d.value)}</td>
                          <td>{pct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                Sem despesas neste mês
              </div>
            )}
          </div>

          {pieData.length > 0 && (
            <ul className="space-y-1.5" aria-label="Distribuição de despesas">
              {pieData.slice().sort((a, b) => b.value - a.value).map((d, i) => {
                const pct = total > 0 ? (d.value / total) * 100 : 0;
                return (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-border"
                        style={{ background: d.color }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-foreground truncate">{d.icon} {d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-sm font-semibold text-foreground">{fmt(d.value)}</span>
                      <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Stats column */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          {stats.map(s => (
            <div key={s.label} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.tone === "success" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                  aria-hidden="true"
                >
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium truncate">{s.label}</span>
              </div>
              <span className={`font-mono font-bold text-base sm:text-lg ${s.tone === "success" ? "text-success" : "text-destructive"}`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
