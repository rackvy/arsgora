import ReactDOM from "react-dom/client";
import WidgetRoot from "./WidgetRoot";
import type { WidgetConfig } from "./types";
import "./widget.css";

function init(config: WidgetConfig) {
    const containerId = config.containerId || "arsgora-widget";
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement("div");
        container.id = containerId;
        document.body.appendChild(container);
    }

    const root = ReactDOM.createRoot(container);
    root.render(<WidgetRoot apiBaseUrl={config.apiBaseUrl} />);
}

// ===== DEV-режим: просто рендерим виджет в #root =====
if (import.meta.env.DEV) {
    const devContainerId = "root";
    let container = document.getElementById(devContainerId);
    if (!container) {
        container = document.createElement("div");
        container.id = devContainerId;
        document.body.appendChild(container);
    }

    const root = ReactDOM.createRoot(container);
    root.render(<WidgetRoot apiBaseUrl="http://localhost:4000/api" />);
}

// ===== PROD-режим: глобальный объект ArsGoraWidget =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).ArsGoraWidget = { init };
