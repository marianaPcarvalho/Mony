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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-9 w-9" aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1.5">
          <Select value={String(month).padStart(2, "0")} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-9 w-[130px] text-sm font-semibold" aria-label="Select month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((name, i) => (
                <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={handleYearChange}>
            <SelectTrigger className="h-9 w-[85px] text-sm font-semibold" aria-label="Select year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={() => navigate(1)} className="h-9 w-9" aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="ghost" size="sm" className="text-xs" onClick={goToToday}>
        Today
      </Button>
    </div>
  );
}
