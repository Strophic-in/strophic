"use client";

import { slugify } from "@strophic/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { marked } from "marked";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { type Post, POST_STATUSES, type PostStatus } from "@/lib/types";
import { api } from "@/lib/api";

export function PostEditor({ post }: { post?: Post }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isEdit = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugLocked, setSlugLocked] = useState(isEdit); // don't auto-rewrite an existing slug
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [category, setCategory] = useState(post?.category ?? "Engineering");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "DRAFT");
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");

  const preview = useMemo(
    () => marked.parse(content || "_Nothing to preview yet._", { async: false }) as string,
    [content],
  );

  function buildPayload() {
    return {
      title,
      slug: slug || slugify(title),
      excerpt,
      content,
      coverImage: coverImage || undefined,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      status,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
    };
  }

  const save = useMutation({
    mutationFn: () =>
      post
        ? api.patch(`/api/v1/blog/${post.id}`, buildPayload())
        : api.post("/api/v1/blog", buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      toast.success(isEdit ? "Post saved" : "Post created");
      router.push("/blog");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: () => (post ? api.delete(`/api/v1/blog/${post.id}`) : Promise.resolve()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post deleted");
      router.push("/blog");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit post" : "New post"}
        </h1>
        <div className="flex gap-2">
          {isEdit && (
            <Button variant="outline" onClick={() => del.mutate()} disabled={del.isPending}>
              Delete
            </Button>
          )}
          <Button onClick={() => save.mutate()} disabled={save.isPending || !title || !content}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugLocked) setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Content (Markdown / MDX)</Label>
            <Tabs defaultValue="write">
              <TabsList>
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder={"# Heading\n\nWrite your post in Markdown…"}
                />
              </TabsContent>
              <TabsContent value="preview">
                <div
                  className="prose prose-sm min-h-[28rem] max-w-none rounded-md border p-4 dark:prose-invert"
                  // Admin-authored, trusted content.
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugLocked(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organize</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cover">Cover image URL</Label>
                <Input id="cover" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="metaTitle">Meta title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="metaDescription">Meta description</Label>
                <Textarea
                  id="metaDescription"
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
