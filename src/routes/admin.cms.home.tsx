import { createFileRoute } from "@tanstack/react-router";
import { StructuredCmsEditor } from "@/components/admin/StructuredCmsEditor";
import { homeSchema } from "@/lib/cms/schema";
import { homeDefaults } from "@/lib/cms/defaults";

export const Route = createFileRoute("/admin/cms/home")({
  component: () => (
    <StructuredCmsEditor
      slug="home"
      label="Home page"
      defaultTitle="Car Rental in Hargeisa, Somaliland | Modern Multi Services"
      schema={homeSchema}
      defaults={homeDefaults}
      previewPath="/"
    />
  ),
});