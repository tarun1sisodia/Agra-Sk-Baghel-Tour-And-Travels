import credits from "../../data/package-photo-credits.json";

/** Destination photography, not photographs of an operator-owned tour or vehicle. */
export function PackagePhotoCredits({ urls }: { urls: readonly string[] }) {
  const used = credits.filter((photo) => urls.includes(photo.path));
  if (!used.length) return null;
  const photographers = [...new Set(used.map((photo) => photo.photographer))];
  return <details className="text-body-sm text-on-surface-variant">
    <summary className="cursor-pointer py-3 min-h-12">Destination photos from Pexels · {photographers.join(", ")}</summary>
    <p className="mt-2">Real destination photography, not photos of our vehicles or a previous customer’s trip. <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer" className="underline">Pexels licence</a>.</p>
    <ul className="mt-2 space-y-1">
      {used.map((photo) => <li key={photo.id}><a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{photo.alt} — {photo.photographer}</a></li>)}
    </ul>
  </details>;
}
