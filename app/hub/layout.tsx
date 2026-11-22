import { Suspense, type ReactNode } from "react";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import HubPanelHost from "@/components/study/hub/HubPanel";
import HubShell from "@/components/study/hub/HubShell";

/** Every /hub page shares the hub navigation and the ?open=… reference panels. */
export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <div className="kz-font kz-paper min-h-screen bg-[#f5e9cf] text-[#1c130c] selection:bg-[#c8102e]/20">
      <KzHeader />
      <main>
        <HubShell>{children}</HubShell>
      </main>
      <KzFooter />
      <Suspense fallback={null}>
        <HubPanelHost />
      </Suspense>
    </div>
  );
}
