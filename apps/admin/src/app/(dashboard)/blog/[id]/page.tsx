"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PostEditor } from "@/components/post-editor";
import { api } from "@/lib/api";
import type { Post } from "@/lib/types";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => api.get<{ post: Post }>(`/api/v1/blog/${id}`),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Post not found.</p>;

  return <PostEditor post={data.post} />;
}
