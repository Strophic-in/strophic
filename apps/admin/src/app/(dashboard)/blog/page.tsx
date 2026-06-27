"use client";

import { formatDate } from "@strophic/utils";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
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
import type { Post, PostStatus } from "@/lib/types";

function statusVariant(s: PostStatus): "default" | "secondary" | "outline" {
  if (s === "PUBLISHED") return "default";
  if (s === "DRAFT") return "secondary";
  return "outline";
}

export default function BlogListPage() {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["posts", "admin"],
    queryFn: () => api.getPaginated<Post>("/api/v1/blog?pageSize=50"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-sm text-muted-foreground">Write, edit, and publish posts.</p>
        </div>
        <Button onClick={() => router.push("/blog/new")}>
          <Plus className="h-4 w-4" /> New post
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Updated</TableHead>
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
                  No posts yet. Write your first one.
                </TableCell>
              </TableRow>
            )}
            {query.data?.items.map((post) => (
              <TableRow
                key={post.id}
                className="cursor-pointer"
                onClick={() => router.push(`/blog/${post.id}`)}
              >
                <TableCell>
                  <div className="font-medium">{post.title}</div>
                  <div className="text-sm text-muted-foreground">/{post.slug}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(post.status)} className="capitalize">
                    {post.status.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{post.category}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {formatDate(post.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
