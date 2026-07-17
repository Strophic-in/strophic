"use client";

import { slugify } from "@strophic/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { marked } from "marked";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
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
import { ImageUploadField, uploadImage } from "@/components/image-upload-field";
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

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const insertInputRef = useRef<HTMLInputElement>(null);
  const [inserting, setInserting] = useState(false);

  // Upload an image and drop its Markdown at the cursor position.
  async function onInsertImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setInserting(true);
    try {
      const url = await uploadImage(file);
      const markdown = `![${file.name.replace(/\.[^.]+$/, "")}](${url})`;
      const textarea = contentRef.current;
      const at = textarea ? textarea.selectionStart : content.length;
      setContent((c) => `${c.slice(0, at)}\n\n${markdown}\n\n${c.slice(at)}`);
      toast.success("Image inserted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setInserting(false);
      if (insertInputRef.current) insertInputRef.current.value = "";
    }
  }

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

  const notify = useMutation({
    mutationFn: (force: boolean) =>
      api.post<{ total: number; sent: number; failed: number }>(
        `/api/v1/blog/${post?.id}/notify`,
        { force },
      ),
    onSuccess: ({ total, sent, failed }) => {
      qc.invalidateQueries({ queryKey: ["post", post?.id] });
      if (total === 0) {
        toast.info("No subscribers to notify yet.");
      } else {
        toast.success(
          `Notified ${sent} subscriber${sent === 1 ? "" : "s"}${failed ? ` · ${failed} failed` : ""}.`,
        );
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Notify failed"),
  });

  function handleNotify() {
    if (
      post?.notifiedAt &&
      !window.confirm(
        "Subscribers were already notified for this post. Send the notification again?",
      )
    ) {
      return;
    }
    notify.mutate(Boolean(post?.notifiedAt));
  }

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
          {post?.status === "PUBLISHED" && (
            <Button variant="secondary" onClick={handleNotify} disabled={notify.isPending}>
              {notify.isPending
                ? "Sending…"
                : post.notifiedAt
                  ? "Re-notify subscribers"
                  : "Notify subscribers"}
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
              <div className="flex items-center justify-between gap-2">
                <TabsList>
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <input
                  ref={insertInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onInsertImage(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={inserting}
                  onClick={() => insertInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  {inserting ? "Uploading…" : "Insert image"}
                </Button>
              </div>
              <TabsContent value="write">
                <Textarea
                  ref={contentRef}
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
              <ImageUploadField
                id="cover"
                label="Cover image"
                value={coverImage}
                onChange={setCoverImage}
              />
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
