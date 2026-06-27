"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { AnalyticsDashboard, CountByKey } from "@/lib/types";

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  icon: typeof Eye;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value.toLocaleString?.() ?? value}</p>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({ title, items }: { title: string; items: CountByKey[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
        {items.map((item) => (
          <div key={item.key} className="relative">
            <div
              className="absolute inset-y-0 left-0 rounded bg-primary/10"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
            <div className="relative flex items-center justify-between px-2 py-1.5 text-sm">
              <span className="truncate font-mono text-xs">{item.key}</span>
              <span className="ml-2 shrink-0 tabular-nums text-muted-foreground">{item.count}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const query = useQuery({
    queryKey: ["analytics", days],
    queryFn: () => api.get<AnalyticsDashboard>(`/api/v1/admin/analytics?days=${days}`),
  });

  const data = query.data;
  const maxDaily = Math.max(1, ...(data?.daily.map((d) => d.count) ?? [1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            First-party, cookieless traffic — privacy-preserving by design.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              variant={days === r.days ? "default" : "ghost"}
              size="sm"
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Page views" value={data?.summary.pageviews ?? "—"} icon={Eye} />
        <StatCard title="Unique visitors" value={data?.summary.visitors ?? "—"} icon={Users} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page views per day</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {data && data.daily.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No traffic recorded yet. Views appear here once the site is live and the API URL is
              set.
            </p>
          )}
          {data && data.daily.length > 0 && (
            <div className="flex h-40 items-end gap-1">
              {data.daily.map((d) => (
                <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count}`}>
                  <div
                    className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                    style={{ height: `${Math.max(2, (d.count / maxDaily) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <BreakdownCard title="Top pages" items={data?.topPaths ?? []} />
        <BreakdownCard title="Top referrers" items={data?.topReferrers ?? []} />
      </div>
    </div>
  );
}
