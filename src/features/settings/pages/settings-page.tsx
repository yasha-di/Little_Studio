import { PageHeader } from "@/components/shared";
import { useT } from "@/i18n";

import { LanguageCard } from "../components/language-card";
import { ProviderConnectionCard } from "../components/provider-connection-card";
import { VideoModelsCard } from "../components/video-models-card";

/**
 * Preferences: everything needed to generate — the provider connection and
 * the model catalog — plus the interface language. New sections appear
 * here only once they are real.
 */
export function SettingsPage() {
  const t = useT();
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <div className="flex max-w-2xl flex-col gap-4">
        <LanguageCard />
        <ProviderConnectionCard />
        <VideoModelsCard />
      </div>
    </div>
  );
}
