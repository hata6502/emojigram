import Clarity from "@microsoft/clarity";
import { StrictMode, Suspense } from "react";
import type { FunctionComponent } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";

Clarity.init("tzb0jilbb4");

const Index: FunctionComponent = () => (
  <StrictMode>
    <Suspense>
      <App />
    </Suspense>
  </StrictMode>
);

const container = document.createElement("div");
document.body.append(container);
createRoot(container).render(<Index />);
