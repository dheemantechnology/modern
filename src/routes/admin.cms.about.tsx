import { createFileRoute } from "@tanstack/react-router";
import { StructuredCmsEditor } from "@/components/admin/StructuredCmsEditor";
import { aboutSchema } from "@/lib/cms/schema";
import { aboutDefaults } from "@/lib/cms/defaults";

export const Route = createFileRoute("/admin/cms/about")({
  component: () => (
    <StructuredCmsEditor
      slug="about"
      label="About page"
      defaultTitle="About — Modern Multi Services"
      schema={aboutSchema}
      defaults={aboutDefaults}
      previewPath="/about"
    />
  ),
});