"use client";

import { formatDate } from "@strophic/utils";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { type Lead, LEAD_STATUSES, type LeadStatus } from "@/lib/types";

export default function LeadsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["leads", "list", status, page],
    queryFn: () =>
      api.getPaginated<Lead>(
        `/api/v1/leads?page=${page}&pageSize=20${status !== "ALL" ? `&status=${status}` : ""}`,
      ),
  });

  const pagination = query.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Every contact submission, newest first.</p>
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as LeadStatus | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden lg:table-cell">Service</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No leads found.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer"
                onClick={() => router.push(`/leads/${lead.id}`)}
              >
                <TableCell>
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-sm text-muted-foreground">{lead.email}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{lead.company ?? "—"}</TableCell>
                <TableCell className="hidden lg:table-cell">{lead.service ?? "—"}</TableCell>
                <TableCell className="text-sm capitalize">{lead.source.toLowerCase()}</TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {formatDate(lead.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
