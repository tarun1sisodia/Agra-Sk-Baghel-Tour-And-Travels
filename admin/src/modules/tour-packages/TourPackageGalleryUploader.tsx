import { useState } from "react";
import { Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { uploadTourPackageImage } from "./tour-packages.api";
import { resolveMediaSrc } from "@/lib/api";
import { HERITAGE_PHOTO_PRESETS } from "./tour-packages.constants";
import type { TourPackageGalleryImage } from "./tour-packages.types";

interface TourPackageGalleryUploaderProps {
  gallery: TourPackageGalleryImage[];
  primaryImageUrl: string;
  onGalleryChange: (gallery: TourPackageGalleryImage[]) => void;
  onPrimaryImageChange: (url: string) => void;
  disabled?: boolean;
}

export function TourPackageGalleryUploader({
  gallery,
  primaryImageUrl,
  onGalleryChange,
  onPrimaryImageChange,
  disabled = false,
}: TourPackageGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customCaption, setCustomCaption] = useState("");
  const [customAlt, setCustomAlt] = useState("");

  async function optimizeImage(file: File, maxDim = 1920, quality = 0.85): Promise<{ base64: string; mimeType: "image/jpeg" | "image/png" | "image/webp" }> {
    if (file.size < 800 * 1024 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const raw = reader.result as string;
          const comma = raw.indexOf(",");
          resolve({
            base64: comma >= 0 ? raw.slice(comma + 1) : raw,
            mimeType: file.type as any,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/webp", quality);
        const comma = dataUrl.indexOf(",");
        resolve({
          base64: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl,
          mimeType: "image/webp",
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError("");

    try {
      const added: TourPackageGalleryImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { base64, mimeType } = await optimizeImage(file);
        const autoCaption = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

        const uploaded = await uploadTourPackageImage({
          dataBase64: base64,
          mimeType,
          caption: autoCaption,
          altText: autoCaption,
        });

        if (uploaded.url) {
          added.push({
            url: uploaded.url,
            caption: uploaded.caption || autoCaption,
            alt: uploaded.alt || autoCaption,
          });
        }
      }

      if (added.length > 0) {
        const nextGallery = [...gallery, ...added];
        onGalleryChange(nextGallery);
        if (!primaryImageUrl || primaryImageUrl.includes("placeholder")) {
          onPrimaryImageChange(added[0].url);
        }
      }
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload one or more images.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function addCustomPhoto() {
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    onGalleryChange([
      ...gallery,
      {
        url: trimmed,
        caption: customCaption.trim() || undefined,
        alt: customAlt.trim() || undefined,
      },
    ]);
    if (!primaryImageUrl) onPrimaryImageChange(trimmed);
    setCustomUrl("");
    setCustomCaption("");
    setCustomAlt("");
  }

  function addPresetPhoto(preset: TourPackageGalleryImage) {
    if (gallery.some((g) => g.url === preset.url)) return;
    onGalleryChange([...gallery, preset]);
    if (!primaryImageUrl) onPrimaryImageChange(preset.url);
  }

  function removePhoto(idx: number) {
    const next = gallery.filter((_, i) => i !== idx);
    onGalleryChange(next);
    if (primaryImageUrl === gallery[idx]?.url && next.length > 0) {
      onPrimaryImageChange(next[0].url);
    }
  }

  return (
    <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-ink text-sm">Package Gallery &amp; Photos</h4>
          <p className="text-xs text-ink-soft">
            Upload from device to persistent media storage. The template shows 3 hero bento images plus a thumbnail strip.
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-raised border border-hairline">
          {gallery.length} Photo{gallery.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Device upload button */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-gold text-ink font-semibold text-xs hover:bg-gold-light transition-colors shadow-xs">
          <Upload className="h-3.5 w-3.5" />
          <span>{uploading ? "Uploading to Supabase..." : "Upload Device Images"}</span>
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={uploading || disabled}
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        {uploading && (
          <span className="text-xs text-gold animate-pulse">Compressing &amp; uploading...</span>
        )}
        {uploadError && (
          <span className="text-xs text-rose-400 font-medium">{uploadError}</span>
        )}
      </div>

      {/* Preset Heritage Photos quick add */}
      <div>
        <span className="text-xs text-ink-soft block mb-1.5">Quick-add verified heritage library photos:</span>
        <div className="flex flex-wrap gap-1.5">
          {HERITAGE_PHOTO_PRESETS.map((p, idx) => {
            const added = gallery.some((g) => g.url === p.url);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => addPresetPhoto(p)}
                disabled={added || disabled}
                className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                  added
                    ? "bg-surface text-ink-faint border-hairline cursor-default"
                    : "bg-surface-raised hover:bg-surface border-hairline text-ink hover:text-gold"
                }`}
                title={p.caption}
              >
                {added ? "✓" : "+"} {p.caption?.split(" ")[0]} {p.caption?.split(" ")[1]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add via direct URL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-hairline/60">
        <Input
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder="https://... image URL"
          className="text-xs h-8"
          disabled={disabled}
        />
        <Input
          value={customCaption}
          onChange={(e) => setCustomCaption(e.target.value)}
          placeholder="Caption (e.g. Taj at Dawn)"
          className="text-xs h-8"
          disabled={disabled}
        />
        <div className="flex gap-2">
          <Input
            value={customAlt}
            onChange={(e) => setCustomAlt(e.target.value)}
            placeholder="Alt text"
            className="text-xs h-8"
            disabled={disabled}
          />
          <Button size="sm" variant="outline" type="button" onClick={addCustomPhoto} disabled={disabled || !customUrl.trim()}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Thumbnails display */}
      {gallery.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-hairline/60">
          {gallery.map((g, idx) => {
            const isPrimary = primaryImageUrl === g.url;
            return (
              <div key={idx} className="relative group rounded border border-hairline bg-surface overflow-hidden p-1">
                <div className="relative h-20 w-full rounded overflow-hidden bg-black/20">
                  <ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-ink-faint" aria-hidden="true" />
                  <img
                    src={resolveMediaSrc(g.url)}
                    alt={g.alt || g.caption || `Photo ${idx + 1}`}
                    className="relative w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  {isPrimary && (
                    <span className="absolute top-1 left-1 bg-gold text-ink text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    disabled={disabled}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-ink-soft truncate max-w-[120px]" title={g.caption || g.url}>
                    {g.caption || "No caption"}
                  </span>
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => onPrimaryImageChange(g.url)}
                      disabled={disabled}
                      className="text-[10px] text-gold hover:underline font-medium"
                    >
                      Make Cover
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
