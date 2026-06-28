import type { AppConfig } from "../env";

export interface RebuildResult {
  /** true when the deploy hook was reached; false when not configured or it failed. */
  triggered: boolean;
  /** true when no DEPLOY_HOOK_URL is configured. */
  notConfigured?: boolean;
}

/**
 * Triggers a static-site rebuild by POSTing to a configured deploy hook
 * (e.g. a Cloudflare Pages Deploy Hook). Best-effort and time-boxed so it can
 * never fail or noticeably slow an admin action.
 */
export class DeployService {
  constructor(private readonly deps: { config: AppConfig }) {}

  async triggerRebuild(): Promise<RebuildResult> {
    const url = this.deps.config.deployHookUrl;
    if (!url) return { triggered: false, notConfigured: true };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { method: "POST", signal: controller.signal });
      return { triggered: res.ok };
    } catch (error) {
      console.error("[deploy] rebuild trigger failed:", error);
      return { triggered: false };
    } finally {
      clearTimeout(timeout);
    }
  }
}
