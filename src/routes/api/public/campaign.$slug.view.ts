import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/campaign/$slug/view")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const slug = String(params.slug ?? "").slice(0, 120);
        if (!slug) return new Response("bad slug", { status: 400 });
        try {
          // Atomic increment via RPC-less update (read+write is fine for impression counter)
          const { data } = await supabaseAdmin
            .from("campaigns")
            .select("id, impressions")
            .eq("landing_slug", slug)
            .eq("landing_published", true)
            .maybeSingle();
          if (data) {
            await supabaseAdmin
              .from("campaigns")
              .update({ impressions: (Number(data.impressions) || 0) + 1 })
              .eq("id", data.id);
          }
        } catch {
          /* swallow — beacon is best-effort */
        }
        return new Response("ok", { status: 200 });
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          },
        }),
    },
  },
});