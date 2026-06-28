"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface SettingRow {
  id: string;
  group: string;
  value: Record<string, unknown>;
  updatedAt: string;
}

interface GroupDef {
  group: string;
  title: string;
  fields: { key: string; label: string }[];
}

const GROUPS: GroupDef[] = [
  {
    group: "company",
    title: "Company",
    fields: [
      { key: "name", label: "Name" },
      { key: "tagline", label: "Tagline" },
      { key: "url", label: "Website URL" },
      { key: "email", label: "Contact email" },
    ],
  },
  {
    group: "social",
    title: "Social links",
    fields: [
      { key: "instagram", label: "Instagram" },
      { key: "x", label: "X (Twitter)" },
      { key: "linkedin", label: "LinkedIn" },
      { key: "github", label: "GitHub" },
    ],
  },
];

function GroupForm({ def, initial }: { def: GroupDef; initial: Record<string, unknown> }) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of def.fields) v[f.key] = typeof initial[f.key] === "string" ? String(initial[f.key]) : "";
    return v;
  });

  const save = useMutation({
    mutationFn: () => api.put("/api/v1/settings", { group: def.group, value: values }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success(`${def.title} saved`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{def.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {def.fields.map((f) => (
          <div key={f.key} className="grid gap-2">
            <Label htmlFor={`${def.group}-${f.key}`}>{f.label}</Label>
            <Input
              id={`${def.group}-${f.key}`}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-fit">
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function PublishCard() {
  const rebuild = useMutation({
    mutationFn: () => api.post<{ triggered: boolean; notConfigured?: boolean }>("/api/v1/admin/deploy"),
    onSuccess: (res) => {
      if (res.notConfigured) {
        toast.error("No deploy hook configured (set DEPLOY_HOOK_URL on the API).");
      } else if (res.triggered) {
        toast.success("Rebuild triggered - the site will update in a minute or two.");
      } else {
        toast.error("Rebuild failed - check the deploy hook URL.");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Rebuild failed"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish to live site</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The public website is static and rebuilds automatically when you publish content. Use this
          to force a rebuild now - for example after changing settings.
        </p>
        <Button onClick={() => rebuild.mutate()} disabled={rebuild.isPending} className="w-fit">
          {rebuild.isPending ? "Triggering…" : "Rebuild site"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<{ settings: SettingRow[] }>("/api/v1/settings"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const byGroup = new Map((data?.settings ?? []).map((s) => [s.group, s.value]));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Company details and links used across the platform.
        </p>
      </div>
      {GROUPS.map((g) => (
        <GroupForm
          key={g.group}
          def={g}
          initial={(byGroup.get(g.group) as Record<string, unknown> | undefined) ?? {}}
        />
      ))}
      <PublishCard />
    </div>
  );
}
