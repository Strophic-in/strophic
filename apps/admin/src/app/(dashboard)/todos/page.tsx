"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
  TODO_PRIORITIES,
  TODO_STATUSES,
  type Todo,
  type TodoPriority,
  type TodoStatus,
} from "@/lib/types";

interface FormState {
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
};

function toForm(t: Todo): FormState {
  return {
    title: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "",
  };
}

function statusVariant(s: TodoStatus): "default" | "secondary" | "outline" {
  if (s === "DONE") return "secondary";
  if (s === "IN_PROGRESS") return "default";
  return "outline";
}
function priorityVariant(p: TodoPriority): "default" | "secondary" | "outline" {
  if (p === "HIGH") return "default";
  if (p === "MEDIUM") return "outline";
  return "secondary";
}
const labelize = (s: string) => s.replace(/_/g, " ").toLowerCase();

export default function TodosPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["todos", "admin"],
    // NOTE: the API caps pageSize at 100 (paginationSchema) - larger values 400.
    queryFn: () => api.getPaginated<Todo>("/api/v1/admin/todos?pageSize=100"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(t: Todo) {
    setEditing(t);
    setForm(toForm(t));
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        // empty string clears the due date; a value sets it.
        dueDate: form.dueDate ? form.dueDate : null,
      };
      return editing
        ? api.patch(`/api/v1/admin/todos/${editing.id}`, payload)
        : api.post("/api/v1/admin/todos", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      toast.success(editing ? "Task updated" : "Task created");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const quickStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TodoStatus }) =>
      api.patch(`/api/v1/admin/todos/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/admin/todos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      toast.success("Task deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>
          <p className="text-sm text-muted-foreground">Internal tasks &amp; reminders.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="hidden sm:table-cell">Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
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
            {query.isError && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-destructive">
                  Couldn&apos;t load tasks:{" "}
                  {query.error instanceof Error ? query.error.message : "unknown error"}
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No tasks yet.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => openEdit(t)}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={t.status === "DONE"}
                    aria-label="Toggle done"
                    onChange={(e) =>
                      quickStatus.mutate({ id: t.id, status: e.target.checked ? "DONE" : "TODO" })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className={t.status === "DONE" ? "font-medium line-through opacity-60" : "font-medium"}>
                    {t.title}
                  </div>
                  {t.description && (
                    <div className="line-clamp-1 text-sm text-muted-foreground">{t.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={priorityVariant(t.priority)}>{labelize(t.priority)}</Badge>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {t.dueDate ? t.dueDate.slice(0, 10) : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(t.status)} className="capitalize">
                    {labelize(t.status)}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={del.isPending}
                    onClick={() => del.mutate(t.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as TodoStatus })}
                >
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TODO_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {labelize(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as TodoPriority })}
                >
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TODO_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {labelize(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.title}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
