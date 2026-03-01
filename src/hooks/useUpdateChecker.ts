import { useState, useEffect, useCallback } from "react";

const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const BUILD_ID_KEY = "app_build_id";

/**
 * Periodically fetches index.html and checks if the build has changed.
 * Returns `updateAvailable` when a new deploy is detected.
 */
export const useUpdateChecker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const extractBuildId = (html: string): string | null => {
    // Vite adds hashed script/css filenames on every build
    const match = html.match(/assets\/index-([a-zA-Z0-9]+)\.(js|css)/);
    return match ? match[1] : null;
  };

  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch(`/?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { Accept: "text/html" },
      });
      if (!res.ok) return;
      const html = await res.text();
      const remoteBuildId = extractBuildId(html);
      if (!remoteBuildId) return;

      const storedBuildId = sessionStorage.getItem(BUILD_ID_KEY);

      if (!storedBuildId) {
        // First load — just store current build ID
        sessionStorage.setItem(BUILD_ID_KEY, remoteBuildId);
      } else if (storedBuildId !== remoteBuildId) {
        // Build changed!
        setUpdateAvailable(true);
      }
    } catch {
      // Network error — ignore silently
    }
  }, []);

  const applyUpdate = useCallback(() => {
    sessionStorage.removeItem(BUILD_ID_KEY);
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    // Initial check after a short delay
    const initialTimer = setTimeout(checkForUpdate, 10_000);
    // Periodic checks
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [checkForUpdate]);

  return { updateAvailable, applyUpdate, dismissUpdate };
};
