"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Lead, Subscriber } from "@/lib/types";

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const allLeads = useQuery({
    queryKey: ["leads", "all", "count"],
    queryFn: () => api.getPaginated<Lead>("/api/v1/leads?pageSize=1"),
  });
  const newLeads = useQuery({
    queryKey: ["leads", "new", "count"],
    queryFn: () => api.getPaginated<Lead>("/api/v1/leads?status=NEW&pageSize=1"),
  });
  const subscribers = useQuery({
    queryKey: ["subscribers", "count"],
    queryFn: () => api.getPaginated<Subscriber>("/api/v1/newsletter?pageSize=1"),
  });
  const recent = useQuery({
    queryKey: ["leads", "recent"],
    queryFn: () => api.getPaginated<Lead>("/api/v1/leads?pageSize=6"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">What's happening across Strophic.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total leads" value={allLeads.data?.pagination.total ?? "-"} icon={Users} />
        <StatCard title="New leads" value={newLeads.data?.pagination.total ?? "-"} icon={TrendingUp} />
        <StatCard
          title="Subscribers"
          value={subscribers.data?.pagination.total ?? "-"}
          icon={Mail}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent leads</CardTitle>
          <Link href="/leads" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="divide-y">
          {recent.isLoading && <p className="py-4 text-sm text-muted-foreground">Loading…</p>}
          {recent.data?.items.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">No leads yet.</p>
          )}
          {recent.data?.items.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="flex items-center justify-between gap-4 py-3 hover:opacity-80"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{lead.name}</p>
                <p className="truncate text-sm text-muted-foreground">{lead.email}</p>
              </div>
              <StatusBadge status={lead.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
