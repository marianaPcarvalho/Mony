import { useStore } from "@/lib/store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useStore();
  const [year, month] = selectedMonth.split("-").map(Number);

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const isFuture = (y: number, m: number) => y > curYear || (y === curYear && m > curMonth);

  const navigate = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    if (isFuture(y, m)) return;
    setSelectedMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  const goToToday = () => {
    setSelectedMonth(`${curYear}-${String(curMonth).padStart(2, "0")}`);
  };

  const handleMonthChange = (val: string) => {
    const m = Number(val);
    if (isFuture(year, m)) return;
    setSelectedMonth(`${year}-${val}`);
  };

  const handleYearChange = (val: string) => {
    const y = Number(val);
    let m = month;
    if (isFuture(y, m)) m = curMonth; // clamp to current month if user picks current year while future
    setSelectedMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  const years = Array.from({ length: 7 }, (_, i) => year - 3 + i).filter(y => y <= curYear);
  const nextDisabled = isFuture(year, month + 1) || (month === 12 && isFuture(year + 1, 1));

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={goToToday}>
        Hoje
      </Button>
      <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-8 w-8" aria-label="Mês anterior">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={String(month).padStart(2, "0")} onValueChange={handleMonthChange}>
        <SelectTrigger className="h-8 w-[110px] text-xs font-semibold" aria-label="Selecionar mês">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((name, i) => {
            const m = i + 1;
            return (
              <SelectItem key={i} value={String(m).padStart(2, "0")} disabled={isFuture(year, m)}>
                {name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={handleYearChange}>
        <SelectTrigger className="h-8 w-[75px] text-xs font-semibold" aria-label="Selecionar ano">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={() => navigate(1)} className="h-8 w-8" aria-label="Mês seguinte" disabled={nextDisabled}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
