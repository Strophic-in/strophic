"use client";

import { formatDate } from "@strophic/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  type LeadDetail,
  type LeadPriority,
  type LeadStatus,
} from "@/lib/types";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right capitalize">{value}</span>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const query = useQuery({
    queryKey: ["lead", id],
    queryFn: () => api.get<{ lead: LeadDetail }>(`/api/v1/leads/${id}`),
  });
  const lead = query.data?.lead;

  const patch = useMutation({
    mutationFn: (body: Partial<{ status: LeadStatus; priority: LeadPriority }>) =>
      api.patch(`/api/v1/leads/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const addNote = useMutation({
    mutationFn: (body: string) => api.post(`/api/v1/leads/${id}/notes`, { body }),
    onSuccess: () => {
      setNote("");
      qc.invalidateQueries({ queryKey: ["lead", id] });
      toast.success("Note added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add note"),
  });

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!lead) return <p className="text-sm text-muted-foreground">Lead not found.</p>;

  return (
    <div className="space-y-6">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{lead.name}</h1>
          <a href={`mailto:${lead.email}`} className="text-sm text-primary hover:underline">
            {lead.email}
          </a>
          {lead.company && <p className="text-sm text-muted-foreground">{lead.company}</p>}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={lead.status} />
          <PriorityBadge priority={lead.priority} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{lead.message}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a follow-up note…"
                  rows={2}
                />
                <Button
                  disabled={!note.trim() || addNote.isPending}
                  onClick={() => addNote.mutate(note.trim())}
                >
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {lead.notes.length === 0 && (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                )}
                {lead.notes.map((n) => (
                  <div key={n.id} className="rounded-md border p-3">
                    <p className="text-sm">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.author?.name ?? "Someone"} · {formatDate(n.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={lead.status}
                  onValueChange={(v) => patch.mutate({ status: v as LeadStatus })}
                >
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={lead.priority}
                  onValueChange={(v) => patch.mutate({ priority: v as LeadPriority })}
                >
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <DetailRow label="Source" value={lead.source.toLowerCase()} />
              <DetailRow label="Service" value={lead.service ?? "—"} />
              <DetailRow label="Received" value={formatDate(lead.createdAt)} />
              {lead.tags.length > 0 && <DetailRow label="Tags" value={lead.tags.join(", ")} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
