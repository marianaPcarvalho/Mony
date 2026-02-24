import { useStore } from "@/lib/store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-semibold text-sm min-w-[140px] text-center">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <Button variant="ghost" size="icon" onClick={() => navigate(1)} className="h-8 w-8">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
