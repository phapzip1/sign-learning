import React, { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ActivityCalendar, type Activity, type Props } from "react-activity-calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Flame, TrendingUp } from "lucide-react";
import {
  getYearsStats,
  getStreakStats,
  getHeatmapStats,
  getChartStats,
} from "@/src/lib/api";
import { useAuth } from "@clerk/tanstack-react-start";
import { create } from "zustand";
import { RemoteActivity } from "@/src/types/stats.type";

const ActivityChart = lazy(() => import("@/src/components/activity-chart"));

const calendarProps: Omit<Props, "data"> = {
  theme: { light: ["#efeaf8", "#6d3fd6"] },
  colorScheme: "light",
  showMonthLabels: true,
  // Every other day, like GitHub, so the label column stays readable.
  showWeekdayLabels: ["mon", "wed", "fri"],
  blockRadius: 3,
  labels: { totalCount: "{{count}} reviews in {{year}}" },
  showColorLegend: false,
  minLevel: 0,
  maxLevel: 5,
  tooltips: {
    activity: {
      text: (activity) => `${activity.count} reviews on ${activity.date}`,
    },
  },
};

// A year spans up to 54 week columns (53 plus a partial one).
const CALENDAR_WEEKS = 54;
// Room reserved for the weekday label column.
const WEEKDAY_LABEL_WIDTH = 40;

// Sizes the heatmap squares so a full year fits the container's width,
// down to a minimum size; below that the container scrolls horizontally.
const useFittedBlockSize = (ref: React.RefObject<HTMLElement | null>) => {
  const [size, setSize] = useState({ blockSize: 14, blockMargin: 4 });

  useEffect(() => {
    const element = ref.current;

    if (!element)
      return;

    const observer = new ResizeObserver(([entry]) => {
      const perWeek = (entry.contentRect.width - WEEKDAY_LABEL_WIDTH) / CALENDAR_WEEKS;
      const blockMargin = perWeek < 14 ? 2 : perWeek < 17 ? 3 : 4;
      const blockSize = Math.max(9, Math.min(14, Math.floor(perWeek - blockMargin)));

      setSize((prev) =>
        prev.blockSize === blockSize && prev.blockMargin === blockMargin
          ? prev
          : { blockSize, blockMargin });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return size;
}

const activiyPeriods = [
  {
    id: "week",
    label: "Week",
    value: 0,
  },
  {
    id: "monnth",
    label: "Month",
    value: 1,
  },
  {
    id: "quarter",
    label: "Quarter",
    value: 2,
  },
];

type HeatmapState = {
  state:
  | "uninitialized"
  | "initializing"
  | "initialized"
  | "loading"
  | "loaded";

  availableYears: number[];
  selectedYear: number;
  data: Activity[];

  setAvailableYears: (years: number[]) => void;
  setSelectedYear: (year: number) => void;
  setData: (data: Activity[]) => void;
  setState: (state: HeatmapState["state"]) => void;
};

type StreakState = {
  state: "unloaded" | "loading" | "loaded";
  value: number;

  setValue: (value: number) => void;
  setState: (state: StreakState["state"]) => void;
};

type ChartState = {
  state: "unloaded" | "loading" | "loaded";
  value: RemoteActivity[];

  setValue: (value: RemoteActivity[]) => void;
  setState: (state: ChartState["state"]) => void;
};

const useHeatmap = create<HeatmapState>()((set) => ({
  state: "uninitialized",
  availableYears: [],
  selectedYear: new Date().getFullYear(),
  data: [],

  setAvailableYears: (availableYears) =>
    set({ availableYears }),

  setSelectedYear: (selectedYear) => set({ selectedYear }),

  setData: (data) => set({ data }),

  setState: (state) => set({ state }),
}));

const useStreak = create<StreakState>()((set) => ({
  state: "unloaded",
  value: 0,

  setValue: (value) =>
    set({ value }),

  setState: (state) =>
    set({ state }),
}));

const useChart = create<ChartState>()((set) => ({
  state: "unloaded",
  value: [],

  setValue: (value) =>
    set({ value }),

  setState: (state) =>
    set({ state }),
}));

const MeIndexPage: React.FC = () => {
  const { getToken } = useAuth();
  const calendarRef = React.useRef<HTMLDivElement>(null);
  const calendarSize = useFittedBlockSize(calendarRef);
  const currentYear = new Date().getFullYear();

  const [period, setPeriod] = useState(0);

  const {
    state: heatmapState,
    availableYears,
    selectedYear,
    data: heatmapData,
    setAvailableYears,
    setSelectedYear,
    setData: setHeatmapData,
    setState: setHeatmapState,
  } = useHeatmap();

  const {
    state: streakState,
    value: streakValue,
    setValue: setStreakValue,
    setState: setStreakState,
  } = useStreak();

  const {
    state: chartState,
    value: chartData,
    setValue: setChartData,
    setState: setChartState,
  } = useChart();

  useEffect(() => {
    const loadInitialStats = async () => {
      const token = await getToken();

      if (!token)
        return;

      const auth = `Bearer ${token}`;

      setHeatmapState("initializing");
      setStreakState("loading");

      try {
        const [yearsResult, streakResult] = await Promise.all([
          getYearsStats(auth),
          getStreakStats(auth),
        ]);

        setAvailableYears(yearsResult);

        // Always open on this year, even before any activity is recorded in it.
        setSelectedYear(new Date().getFullYear());

        setStreakValue(streakResult);

        setHeatmapState("initialized");
        setStreakState("loaded");
      } catch (error) {
        console.error(error);
      }
    };

    loadInitialStats();
  }, [getToken]);

  useEffect(() => {
    if (!selectedYear)
      return;

    const loadHeatmap = async () => {
      const token = await getToken();

      if (!token)
        return;

      const auth = `Bearer ${token}`;

      setHeatmapState("loading");

      try {
        const result = await getHeatmapStats(selectedYear, auth);

        setHeatmapData(result.activities);

        setHeatmapState("loaded");
      } catch (error) {
        console.error(error);
      }
    };

    loadHeatmap();
  }, [selectedYear, getToken]);

  useEffect(() => {
    let cancelled = false;

    const loadChart = async () => {
      const token = await getToken();

      if (!token) return;
      const auth = `Bearer ${token}`;

      setChartState("loading");

      try {
        const result = await getChartStats(
          period,
          auth
        );

        if (cancelled) return;

        setChartData(result.data);
        setChartState("loaded");
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setChartData([]);
        setChartState("loaded");
      }
    };

    loadChart();

    return () => {
      cancelled = true;
    };
  }, [
    period,
    getToken,
    setChartData,
    setChartState,
  ]);

  const hasActivity = heatmapData.some(activity => activity.count > 0);

  // This year is always selectable; past years only when they have activity.
  const yearOptions = React.useMemo(
    () => Array.from(new Set([currentYear, ...availableYears]))
      .sort((a, b) => b - a)
      .map((year) => ({ value: year, label: String(year) })),
    [availableYears, currentYear]
  );

  // On narrow screens the calendar scrolls; start at the most recent weeks.
  useEffect(() => {
    const element = calendarRef.current;

    if (element && heatmapState === "loaded" && selectedYear === currentYear) {
      element.scrollLeft = element.scrollWidth;
    }
  }, [heatmapState, selectedYear, currentYear, calendarSize]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Streak */}
        <Card className="relative overflow-hidden bg-linear-to-br from-highlight/60 to-amber-200/40 ring-highlight/50">
          <div className="pointer-events-none absolute -right-8 -bottom-8 size-40 rounded-full bg-white/30 blur-2xl" />
          <CardContent className="relative flex h-full flex-col justify-between gap-6">
            <div className="flex items-center gap-2 font-bold text-highlight-foreground">
              <Flame className="size-5" />
              Current streak
            </div>
            {streakState === "loading" ? (
              <Skeleton className="h-16 w-32 bg-white/50" />
            ) : (
              <div>
                <p className="text-6xl font-black leading-none text-highlight-foreground">
                  🔥 {streakValue}
                </p>
                <p className="mt-2 font-semibold text-highlight-foreground/80">
                  {streakValue === 1 ? "day" : "days"} in a row
                </p>
              </div>
            )}
            <p className="text-sm text-highlight-foreground/80">
              {streakValue > 0
                ? "Keep it up! Study today to keep the flame alive."
                : "Study a few cards today to start your streak."}
            </p>
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card className="min-w-0">
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-row flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-extrabold">
                <CalendarDays className="size-5 text-primary" />
                Study calendar
              </h2>
              <Select
                items={yearOptions}
                value={selectedYear}
                onValueChange={(year) => {
                  if (year != null) {
                    setSelectedYear(year as number);
                  }
                }}
              >
                <SelectTrigger className="w-32" aria-label="Year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {
                    yearOptions.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div ref={calendarRef} className="min-w-0 overflow-x-auto pb-3">
              {
                heatmapState === "loading" ? (
                  <Skeleton className="h-36 w-full" />
                ) : hasActivity ? (
                  <ActivityCalendar
                    {...calendarProps}
                    {...calendarSize}
                    data={heatmapData}
                  />
                ) : (
                  <div className="flex h-36 flex-col items-center justify-center gap-1 rounded-2xl bg-muted/60 text-center">
                    <p className="font-bold">No study activity yet</p>
                    <p className="text-sm text-muted-foreground">Your practice days will light up here.</p>
                  </div>
                )
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-row flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-extrabold">
              <TrendingUp className="size-5 text-primary" />
              Activity
            </h2>
            <Tabs onValueChange={(v: number) => setPeriod(v)} value={period}>
              <TabsList
              >
                {
                  activiyPeriods.map((period) => {
                    return (
                      <TabsTrigger key={period.id} value={period.value}>{period.label}</TabsTrigger>
                    );
                  })
                }
              </TabsList>
            </Tabs>
          </div>
          {
            chartState === "loading" ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <ActivityChart data={chartData} />
              </Suspense>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/me/")({
  component: MeIndexPage,
  head: () => ({
      meta: [{ title: "Your progress · Sign Learning" }],
  }),
});

