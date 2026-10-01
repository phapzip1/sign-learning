import React, { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ActivityCalendar, type Activity, type Props } from "react-activity-calendar";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  theme: { light: ["#eee", "magenta"] },
  showMonthLabels: true,
  showWeekdayLabels: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  blockSize: 24,
  showColorLegend: false,
  minLevel: 0,
  maxLevel: 5,
  tooltips: {
    activity: {
      text: (activity) => `${activity.count} activities on ${activity.date}`,
    },
  },
};

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

        if (yearsResult.length > 0) {
          const currentYear = new Date().getFullYear();

          const initialYear = yearsResult.includes(currentYear)
            ? currentYear
            : yearsResult[0];

          setSelectedYear(initialYear);
        }

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

  return (
    <div className="flex flex-col gap-4 w-400 mx-auto">
      <Card className="rounded p-0">
        <CardContent className="flex flex-col gap-4 pt-2 pb-4">
          <div className="flex flex-row justify-between items-center">
            <h2 className="block text-2xl font-semibold">Streak</h2>
            <Combobox
              items={availableYears}
              value={
                availableYears.length > 0
                  ? selectedYear
                  : undefined
              }
              onValueChange={(year) => {
                if (year != null) {
                  setSelectedYear(year);
                }
              }}
              disabled={availableYears.length === 0}
            >
              <ComboboxInput
                placeholder={
                  availableYears.length === 0
                    ? "No activity yet"
                    : "Year"
                }
                readOnly
              />

              <ComboboxContent>
                <ComboboxEmpty>
                  No activity years found.
                </ComboboxEmpty>

                <ComboboxList>
                  {(year) => (
                    <ComboboxItem
                      key={year}
                      value={year}
                    >
                      {year}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="flex flex-row gap-4">
            <Card className="rounded">
              <CardContent className="">
                <div className="flex items-center gap-3">
                  {streakState === "loading" ? (
                    <span className="text-muted-foreground">
                      Loading...
                    </span>
                  ) : (
                    <span className="text-2xl font-bold">
                      🔥 {streakValue}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            {
              heatmapState === "loading" ? (
                <h4>Loading...</h4>
              ) : hasActivity ? (
                <ActivityCalendar
                  {...calendarProps}
                  data={heatmapData}
                />
              ) : (
                <h4 className="my-auto text-muted-foreground">
                  No study activity yet.
                </h4>
              )
            }
          </div>
        </CardContent>
      </Card>

      <Separator className="my-2" />

      <Card className="rounded p-0">
        <CardContent className="flex flex-col gap-4 pt-2 pb-4">
          <div className="flex flex-row justify-between items-center-safe">
            <h2 className="block text-2xl font-semibold">Activity</h2>
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
          <Suspense>
            <ActivityChart data={chartData} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/me/")({
  component: MeIndexPage,
});

