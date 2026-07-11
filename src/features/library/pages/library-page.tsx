import { PageHeader } from "@/components/shared";
import { useT } from "@/i18n";

import { VideosGallery } from "../components/videos-gallery";

/**
 * The Library: every video generated in any project, in one searchable
 * place. New asset categories (images, references, templates) join this
 * page as they become real — nothing is promised before it works.
 */
export function LibraryPage() {
  const t = useT();
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      <PageHeader title={t("library.title")} description={t("library.description")} />
      <div className="min-h-0 flex-1">
        <VideosGallery />
      </div>
    </div>
  );
}
