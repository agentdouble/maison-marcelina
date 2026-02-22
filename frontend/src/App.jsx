import { useEffect, useMemo, useState } from "react";

const STATES = {
  loading: "loading",
  ok: "ok",
  error: "error",
};

function getBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  return fromEnv || "http://127.0.0.1:8000";
}

export function App() {
  const [healthState, setHealthState] = useState(STATES.loading);
  const baseUrl = useMemo(() => getBaseUrl(), []);

  useEffect(() => {
    const controller = new AbortController();

    const checkHealth = async () => {
      try {
        const response = await fetch(`${baseUrl}/health`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          setHealthState(STATES.error);
          return;
        }

        const payload = await response.json();
        setHealthState(payload?.status === "ok" ? STATES.ok : STATES.error);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setHealthState(STATES.error);
      }
    };

    void checkHealth();
    return () => controller.abort();
  }, [baseUrl]);

  return (
    <main className={`scene scene--${healthState}`}>
      <div className="grain" aria-hidden="true" />
      <div className="panel" aria-label="app-shell">
        <div className="orbit" aria-hidden="true">
          <div className="core" />
          <span className="satellite satellite--a" />
          <span className="satellite satellite--b" />
          <span className="satellite satellite--c" />
        </div>
      </div>
    </main>
  );
}
