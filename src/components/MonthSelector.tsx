import { useStore } from "@/lib/store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useStore();
  const [year, month] = selectedMonth.split("-").map(Number);

  const navigate = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setSelectedMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  const goToToday = () => {
    const d = new Date();
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleMonthChange = (val: string) => {
    setSelectedMonth(`${year}-${val}`);
  };

  const handleYearChange = (val: string) => {
    setSelectedMonth(`${val}-${String(month).padStart(2, "0")}`);
  };

  const years = Array.from({ length: 7 }, (_, i) => year - 3 + i);

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={goToToday}>
        Today
      </Button>
      <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-8 w-8" aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={String(month).padStart(2, "0")} onValueChange={handleMonthChange}>
        <SelectTrigger className="h-8 w-[110px] text-xs font-semibold" aria-label="Select month">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((name, i) => (
            <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={handleYearChange}>
        <SelectTrigger className="h-8 w-[75px] text-xs font-semibold" aria-label="Select year">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={() => navigate(1)} className="h-8 w-8" aria-label="Next month">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
