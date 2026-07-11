import { AnimatePresence, motion } from "framer-motion";
import { Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { Loading } from "@/components/ui/loading";
import { useShortcut } from "@/hooks";
import { pageVariants } from "@/lib/motion";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

/**
 * The desktop shell: fixed top bar, collapsible sidebar, workspace area.
 * Routes render edge-to-edge with a subtle cross-fade; scrolling and
 * padding belong to each page (the creative workspace needs the full
 * viewport, list pages add their own).
 */
function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  useShortcut("open-settings", () => {
    void navigate("/settings");
  });

  // Scene switches inside one project must not retrigger the page
  // transition (that would remount the whole workspace per click), so the
  // cross-fade keys on the path *without* the scene segment.
  const pageKey = location.pathname.split("/scenes/")[0] ?? location.pathname;

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pageKey}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              <Suspense fallback={<Loading />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export { AppShell };
