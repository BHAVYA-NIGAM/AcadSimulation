import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import TimetableEditorPage from "./components/TimetableEditorPage.jsx";
import UploadLanding from "./components/UploadLanding.jsx";
import {
  fetchHistory,
  fetchHistoryRecord,
  fetchMetrics,
  uploadWorkbook
} from "./services/api.js";

const THEME_STORAGE_KEY = "acad-simulation-theme";

function pageFromPath(pathname) {
  if (pathname === "/timetable-editor") {
    return "timetable-editor";
  }
  return pathname === "/dashboard" ? "dashboard" : "upload";
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    return window.localStorage.getItem(THEME_STORAGE_KEY) || "dark";
  });
  const [metrics, setMetrics] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingHistoryRecord, setIsLoadingHistoryRecord] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(() =>
    pageFromPath(window.location.pathname)
  );
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    function handlePopState() {
      setCurrentPage(pageFromPath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigateTo(page, options = {}) {
    const targetPath =
      page === "dashboard"
        ? "/dashboard"
        : page === "timetable-editor"
          ? "/timetable-editor"
          : "/";
    const historyMethod = options.replace ? "replaceState" : "pushState";

    if (window.location.pathname !== targetPath) {
      window.history[historyMethod]({}, "", targetPath);
    }

    setCurrentPage(page);
  }

  async function loadInitialData() {
    await Promise.all([loadMetrics(), loadHistory()]);
  }

  async function loadMetrics() {
    try {
      setError("");
      const response = await fetchMetrics();
      setMetrics(response);

      if (window.location.pathname === "/dashboard") {
        setCurrentPage("dashboard");
      }
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        if (window.location.pathname === "/dashboard") {
          navigateTo("upload", { replace: true });
        } else {
          setCurrentPage(pageFromPath(window.location.pathname));
        }
      } else {
        const message =
          requestError.response?.data?.message || "Unable to load dashboard metrics.";
        setError(message);
        if (window.location.pathname === "/dashboard") {
          navigateTo("upload", { replace: true });
        } else {
          setCurrentPage(pageFromPath(window.location.pathname));
        }
      }
    } finally {
      setIsInitialLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const response = await fetchHistory();
      setHistory(response);
    } catch (_historyError) {
      setHistory([]);
    }
  }

  async function handleUpload(file) {
    setIsUploading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await uploadWorkbook(file);
      setMetrics(response.metrics);
      await loadHistory();
      setSuccessMessage("Dashboard refreshed successfully from the uploaded workbook.");
      navigateTo("dashboard");
    } catch (uploadError) {
      const message =
        uploadError.response?.data?.message || "Upload failed. Please try again.";
      setError(`${file.name}: ${message}`);
    } finally {
      setIsUploading(false);
    }
  }

  function handleResetToUpload() {
    navigateTo("upload");
    setError("");
    setSuccessMessage("");
  }

  async function handleLoadHistoryRecord(recordId) {
    setIsLoadingHistoryRecord(true);
    setError("");

    try {
      const recordMetrics = await fetchHistoryRecord(recordId);
      setMetrics(recordMetrics);
      navigateTo("dashboard");
      setSuccessMessage("Historical workbook loaded successfully.");
    } catch (historyError) {
      setError(
        historyError.response?.data?.message || "Unable to load the selected historical workbook."
      );
    } finally {
      setIsLoadingHistoryRecord(false);
    }
  }

  function handleOpenDashboard() {
    if (metrics) {
      navigateTo("dashboard");
    }
  }

  function handleOpenTimetableEditor() {
    navigateTo("timetable-editor");
  }

  async function handleMetricsSaved(nextMetrics, message) {
    setMetrics(nextMetrics);
    await loadHistory();
    setSuccessMessage(message);
    navigateTo("dashboard");
  }

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return (
    <main className="dashboard-shell min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="theme-topbar flex flex-wrap items-center justify-between gap-4 rounded-[28px] px-5 py-4 sm:px-6">
          <div>
            <p className="theme-kicker text-2xl uppercase  font-semibold tracking-[0.35em]">
              Academic Block Simulation
            </p>
            {/* <h1 className="theme-heading mt-2 text-2xl font-semibold sm:text-3xl">
              Dashboard workspace
            </h1> */}
          </div>

          <button
            type="button"
            onClick={handleToggleTheme}
            className="theme-button-neutral"
          >
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </button>
        </header>

        {currentPage === "upload" ? (
          <UploadLanding
            isLoading={isInitialLoading}
            isUploading={isUploading}
            onUpload={handleUpload}
            error={error}
            successMessage={successMessage}
            hasMetrics={Boolean(metrics)}
            history={history}
            onOpenDashboard={handleOpenDashboard}
            onOpenTimetableEditor={handleOpenTimetableEditor}
            onSelectRecord={handleLoadHistoryRecord}
          />
        ) : null}

        {currentPage === "dashboard" ? (
          <Dashboard
            theme={theme}
            metrics={metrics}
            isLoading={isInitialLoading}
            isRefreshing={isUploading || isLoadingHistoryRecord}
            statusMessage={successMessage}
            onReset={handleResetToUpload}
            onApplyOptimization={handleMetricsSaved}
            onOpenTimetableEditor={handleOpenTimetableEditor}
            history={history}
            onSelectRecord={handleLoadHistoryRecord}
          />
        ) : null}

        {currentPage === "timetable-editor" ? (
          <TimetableEditorPage
            sourceRecordId={metrics?.meta?.recordId || null}
            onBack={handleResetToUpload}
            onSaved={handleMetricsSaved}
            onOpenDashboard={handleOpenDashboard}
          />
        ) : null}
      </div>
    </main>
  );
}
