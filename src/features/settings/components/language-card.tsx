import { Languages } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { localeNames, LOCALES, useI18n, type Locale } from "@/i18n";

/**
 * The interface language selector. Language names are shown in their own
 * language (never translated) so a user can always find their way home.
 * The choice applies instantly and persists on this device.
 */
export function LanguageCard() {
  const { locale, setLocale, t } = useI18n();

  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2">
            <Languages className="size-4 text-muted-foreground" />
            {t("settings.language")}
          </CardTitle>
          <CardDescription>{t("settings.languageDescription")}</CardDescription>
        </div>
        <CardContent className="p-0">
          <Select
            value={locale}
            onValueChange={(next) => {
              setLocale(next as Locale);
            }}
          >
            <SelectTrigger className="w-36" aria-label={t("settings.language")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((code) => (
                <SelectItem key={code} value={code}>
                  {localeNames[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </CardHeader>
    </Card>
  );
}
