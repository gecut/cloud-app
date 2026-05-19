import { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";

import { RootProviders } from "@/app/providers/root-providers";
import { GecutPageLoader } from "@/app/components/feedback/page-loader";

import "./index.css";

const AppBootstrap = lazy(async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 1000));

  return await import("@/app/app-bootstrap");
});

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <RootProviders>
      <Suspense fallback={<GecutPageLoader />}>
        <AppBootstrap />
      </Suspense>
    </RootProviders>
  );
}
