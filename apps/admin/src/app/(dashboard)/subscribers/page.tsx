"use client";

import { formatDate } from "@strophic/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import type { Subscriber } from "@/lib/types";

export default function SubscribersPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["subscribers", "list", page],
    queryFn: () => api.getPaginated<Subscriber>(`/api/v1/newsletter?page=${page}&pageSize=25`),
  });
  const pagination = query.data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscribers</h1>
        <p className="text-sm text-muted-foreground">Newsletter sign-ups.</p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Source</TableHead>
              <TableHead className="hidden sm:table-cell">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No subscribers yet.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.email}</TableCell>
                <TableCell>
                  <Badge variant={sub.status === "SUBSCRIBED" ? "default" : "secondary"}>
                    {sub.status.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {sub.source ?? "-"}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {formatDate(sub.createdAt)}
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
