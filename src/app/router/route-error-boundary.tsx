import { TriangleAlert } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router";

import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

/**
 * Last-resort error surface for the router tree. Keeps the shell usable
 * instead of white-screening when a route render throws.
 */
export function RouteErrorBoundary() {
  const t = useT();
  const error = useRouteError();

  const description = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : t("errorBoundary.unexpected");

  return (
    <div className="flex h-full items-center justify-center bg-background">
      <EmptyState
        icon={TriangleAlert}
        title={t("errorBoundary.title")}
        description={description}
        action={
          <Button
            variant="secondary"
            onClick={() => {
              window.location.reload();
            }}
          >
            {t("errorBoundary.reload")}
          </Button>
        }
      />
    </div>
  );
}
