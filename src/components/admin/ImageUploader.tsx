import { useRef, useState } from "react";
import { Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
  aspect?: "square" | "video" | "auto";
};

export function ImageUploader({ value, onChange, folder = "misc", label = "Image", aspect = "video" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("public-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const aspectCls = aspect === "square" ? "aspect-square" : aspect === "video" ? "aspect-video" : "";

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div
        className={`group relative ${aspectCls} w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 transition hover:border-cyan`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg opacity-0 transition group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"
            >
              <Upload className="h-3.5 w-3.5" /> Replace
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground hover:text-cyan"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <ImagePlus className="h-8 w-8" />
            )}
            <span className="text-sm font-medium">
              {uploading ? "Uploading…" : "Click or drop image"}
            </span>
            <span className="text-xs">PNG, JPG up to 5 MB</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </div>
    </div>
  );
}