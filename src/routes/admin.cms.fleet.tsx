import { createFileRoute } from "@tanstack/react-router";
import { StructuredCmsEditor } from "@/components/admin/StructuredCmsEditor";
import { fleetIndexSchema } from "@/lib/cms/schema";
import { fleetIndexDefaults } from "@/lib/cms/defaults";

export const Route = createFileRoute("/admin/cms/fleet")({
  component: () => (
    <StructuredCmsEditor
      slug="fleet"
      label="Fleet page"
      defaultTitle="Fleet — Modern Multi Services"
      schema={fleetIndexSchema}
      defaults={fleetIndexDefaults}
      previewPath="/fleet"
    />
  ),
});