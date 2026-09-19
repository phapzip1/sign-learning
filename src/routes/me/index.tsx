import React, { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ActivityCalendar, type Activity, type Props } from "react-activity-calendar";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// import ActivityChart from "@/src/components/activity-chart";

const ActivityChart = lazy(() => import("@/src/components/activity-chart"));

const calendarProps: Omit<Props, "data"> = {
  theme: { light: ["#eee", "magenta"] },
  showMonthLabels: true,
  showWeekdayLabels: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  blockSize: 18,
  showColorLegend: false,
  minLevel: 0,
  maxLevel: 5,
  tooltips: {
    activity: {
      text: (activity) => `${activity.count} activities on ${activity.date}`,
    },
  },
};


const years = ["2025", "2024"];

const activiyPeriods = [
  {
    id: "week",
    label: "Week",
  },
  {
    id: "monnth",
    label: "Month",
  },
  {
    id: "year",
    label: "Year",
  },
];

const MeIndexPage: React.FC = () => {
  const data: Activity[] = [
    {
      date: "2024-01-23",
      count: 2,
      level: 1,
    },
    {
      date: "2024-06-23",
      count: 2,
      level: 1,
    },
    {
      date: "2024-08-02",
      count: 16,
      level: 4,
    },
    {
      date: "2024-11-29",
      count: 11,
      level: 3,
    },
  ];


  return (
    <div className="flex flex-col gap-4 w-400 mx-auto">
      <Card className="rounded p-0">
        <CardContent className="flex flex-col gap-4 pt-2 pb-4">
          <div className="flex flex-row justify-between items-center">
            <h2 className="block text-2xl font-semibold">Streak</h2>
            <Combobox items={years} defaultValue={years[0]}>
              <ComboboxInput placeholder="All category" className="mb-2" readOnly />
              <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="flex flex-row gap-4">
            <Card className="rounded">
              <CardContent className="flex flex-col gap-1 justify-center-safe items-center-safe h-full">
                <h3 className="font-semibold text-3xl">170</h3>
                <h4 className="font-medium text-lg">CARDS / DAY</h4>
                <p className="text-muted-foreground">daily average</p>
              </CardContent>
            </Card>
            <ActivityCalendar {...calendarProps} data={data} />
          </div>
        </CardContent>
      </Card>

      <Separator className="my-2" />

      <Card className="rounded p-0">
        <CardContent className="flex flex-col gap-4 pt-2 pb-4">
          <div className="flex flex-row justify-between items-center-safe">
            <h2 className="block text-2xl font-semibold">Activity</h2>
            <Tabs
              defaultValue={activiyPeriods[0].id}
            >
              <TabsList
              >
                {
                  activiyPeriods.map((period) => {
                    return (
                      <TabsTrigger value={period.id}>{period.label}</TabsTrigger>
                    );
                  })
                }
              </TabsList>
            </Tabs>
          </div>
          <Suspense>
            <ActivityChart />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/me/")({
  component: MeIndexPage,
});

