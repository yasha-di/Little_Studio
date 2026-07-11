import { Compass } from "lucide-react";
import { NavLink } from "react-router";

import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

export function NotFoundPage() {
  const t = useT();
  return (
    <EmptyState
      icon={Compass}
      title={t("notFound.title")}
      description={t("notFound.description")}
      action={
        <Button variant="secondary" asChild>
          <NavLink to="/projects">{t("notFound.back")}</NavLink>
        </Button>
      }
    />
  );
}
