import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { homeDefaults, aboutDefaults, fleetIndexDefaults, deepMerge, type HomeContent, type AboutContent, type FleetIndexContent } from "./defaults";

export function useHomeContent(): HomeContent {
  const { data } = useQuery({
    queryKey: ["cms", "home"],
    queryFn: async () => {
      const { data } = await supabase.from("cms_pages").select("sections").eq("slug", "home").maybeSingle();
      return data?.sections ?? null;
    },
    staleTime: 60_000,
  });
  return deepMerge(homeDefaults, data);
}

export function useAboutContent(): AboutContent {
  const { data } = useQuery({
    queryKey: ["cms", "about"],
    queryFn: async () => {
      const { data } = await supabase.from("cms_pages").select("sections").eq("slug", "about").maybeSingle();
      return data?.sections ?? null;
    },
    staleTime: 60_000,
  });
  return deepMerge(aboutDefaults, data);
}

export function useFleetIndexContent(): FleetIndexContent {
  const { data } = useQuery({
    queryKey: ["cms", "fleet"],
    queryFn: async () => {
      const { data } = await supabase.from("cms_pages").select("sections").eq("slug", "fleet").maybeSingle();
      return data?.sections ?? null;
    },
    staleTime: 60_000,
  });
  return deepMerge(fleetIndexDefaults, data);
}