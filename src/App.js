import React, { useState, useEffect, useRef, useCallback } from "react";
import Logo from "./logo.svg";
import { Background } from "./components/Background";
import { RotateCw } from "lucide-react";
import EditorToolbar from "./components/EditorToolbar";
import BurgerMenu from "./components/BurgerMenu";
import Sidebar from "./components/Sidebar";
import EditLayout from "./components/EditLayoutSidebar";
import { Settings, DEFAULT_SETTINGS } from './components/Settings';
import { CustomizationSlider, DEFAULT_CUSTOMIZATION } from './components/CustomizationSlider';
import { FlameButton } from './components/Streak';


/* === ICONS === */
const BurgerIcon = ({ className }) => (
  <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* === EDITOR === */
function Editor({ current, onEditTitle, onEditContent, onToggleMenu, accentHex, goalWords, onStreakUpdate }) {
  const [title, setTitle] = useState(current?.title || "");
  const editorRef = useRef(null);

  useEffect(() => {
    setTitle(current?.title || "");
  }, [current]);

  useEffect(() => {
    if (editorRef.current && current?.content !== undefined) {
      editorRef.current.innerHTML = current.content || "";
    }
  }, [current?.id]);

  const handleInput = (e) => {
    const html = e.currentTarget.innerHTML;
    onEditContent(html);
  };

  const execCommand = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 relative">
      <header className="flex items-center justify-between px-4 py-3 bg-[#060606] border-b border-white/10">
        <div className="flex items-center gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => onEditTitle(title)}
            className="bg-transparent text-white text-lg font-semibold focus:outline-none border-b border-transparent focus:border-white/20"
            placeholder="Untitled"
          />
        </div>

        <div className="flex items-center gap-3">
          <FlameButton
            current={current}
            accentHex={accentHex}
            goalWords={goalWords}
            onStreakUpdate={onStreakUpdate}
          />
          <button
            onClick={onToggleMenu}
            className="p-2 border-2 border-white rounded-md hover:bg-white/5 transition"
          >
            <BurgerIcon className="text-white" />
          </button>
        </div>
      </header>

      <main className="relative flex-1 p-6 overflow-auto">
        {current ? (
          <>
            <EditorToolbar
              execCommand={execCommand}
              accentHex={accentHex}
            />
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="w-full min-h-[400px] bg-[#0f0f10] text-white p-4 rounded-lg shadow-inner focus:outline-none overflow-auto mt-20 leading-relaxed"
              onInput={handleInput}
            />
          </>
        ) : (
          <div className="text-white/40 text-center mt-20">
            Select or create a session to begin.
          </div>
        )}
      </main>
    </div>
  );
}

/* === MAIN APP === */
export default function App() {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [currentId, setCurrentId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [inactive, setInactive] = useState(false);
  const [view, setView] = useState("editor"); // "editor" | "layout"


  // === Load saved sessions & restore books on launch ===
  useEffect(() => {
    // Restore local saved sessions (legacy)
    const saved = localStorage.getItem("offlineWriterSessions");
    const savedId = localStorage.getItem("offlineWriterCurrentId");
    if (saved) {
      setSessions(JSON.parse(saved));
      if (savedId) setCurrentId(savedId);
    }

    // 🔹 Restore previously open books from file paths (via preload)
    const savedBooks = localStorage.getItem("openBooks");
      if (savedBooks) {
        try {
          const books = JSON.parse(savedBooks);
          if (Array.isArray(books) && window.electron?.restoreBooks) {
            window.electron.restoreBooks(books);
          }
        } catch (err) {
          console.error("Failed to restore books:", err);
        }
      }
  }, []);

  //Save open books for next launch
  useEffect(() => {
    localStorage.setItem("openBooks", JSON.stringify(sessions));
  }, [sessions]);

  //Receive validated books from preload (after existence check)
  useEffect(() => {
    const handleRestore = (event) => {
      if (event.data.type === "restored-books") {
        setSessions((prev) => {
          // merge restored books without duplicates
          const newOnes = event.data.books.filter(
            (book) => !prev.some((s) => s.filePath === book.filePath)
          );
          return [...newOnes, ...prev];
        });
      }
      if (event.data.type === "missing-books") {
        event.data.messages.forEach((msg) => alert(msg));
      }
    };
    window.addEventListener("message", handleRestore);
    return () => window.removeEventListener("message", handleRestore);
  }, []);

  useEffect(() => {
    if (window.electron?.onOpenAuthBook) {
      const listener = (book) => {
        if (sessions.some((s) => s.filePath === book.filePath)) return;

        const newBook = {
          id: Date.now().toString(),
          title: book.title || "Untitled Book",
          content: book.content || "",
          preview:
            (book.content || "").replace(/<[^>]*>?/gm, "").slice(0, 60) + "...",
          filePath: book.filePath,
          type: "book",
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        };

        setSessions((prev) => [newBook, ...prev]);
        setCurrentId(newBook.id);
      };

      window.electron.onOpenAuthBook(listener);

      //Clean up event listener when unmounting
      return () => {
        window.removeEventListener("open-authbook", listener);
      };
    }
  }, [sessions]);


  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(
    JSON.parse(localStorage.getItem('writerSettings')) || DEFAULT_SETTINGS
  );

  // Persist on change:
  const handleSaveSettings = (patch) => {
    setSettings(patch);
    localStorage.setItem('writerSettings', JSON.stringify(patch));
    // Sync accent colour → customization so all components update
    if (patch.accentHex !== undefined) {
      const updatedCustomization = { ...customization, accentHex: patch.accentHex };
      setCustomization(updatedCustomization);
      localStorage.setItem('writerCustomization', JSON.stringify(updatedCustomization));
    }
  };


  const [customization, setCustomization] = useState(
    JSON.parse(localStorage.getItem('writerCustomization')) || DEFAULT_CUSTOMIZATION
  );
  const handleSaveCustomization = (patch) => {
    setCustomization(patch);
    localStorage.setItem('writerCustomization', JSON.stringify(patch));
  };

  // Update streak data inside the current session (saved to .authbook on next manual save)
  const handleStreakUpdate = useCallback((updatedStreak) => {
    setSessions(prev => prev.map(s =>
      s.id === currentId ? { ...s, streak: updatedStreak } : s
    ));
  }, [currentId]);

  const newBook = () => {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newS = {
      id,
      title: "Untitled Book",
      preview: "A new story...",
      content: "",
      type: "book",
      created: now,
      updated: now,
    };
    setSessions((s) => [newS, ...s]);
    setCurrentId(id);
  };

  const newStoryboard = () => {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newS = {
      id,
      title: "Untitled Storyboard",
      preview: "Visual outline...",
      content: "",
      type: "storyboard",
      created: now,
      updated: now,
    };
    setSessions((s) => [newS, ...s]);
    setCurrentId(id);
  };

  const handleSelect = (id) => setCurrentId(id);
  const handleEditTitle = (newTitle) =>
    setSessions((s) => s.map((x) => (x.id === currentId ? { ...x, title: newTitle } : x)));
  const handleEditContent = (newContent) =>
    setSessions((s) =>
      s.map((x) =>
        x.id === currentId
          ? { ...x, content: newContent, preview: newContent.replace(/<[^>]*>?/gm, "").slice(0, 60) + "..." }
          : x
      )
    );

  const filtered = sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
  const current = sessions.find((s) => s.id === currentId) || null;

  return (
    <div className="h-screen flex text-white relative">
      <Background
        accentHex={customization.accentHex}
        backgroundOpacity={customization.backgroundOpacity}
        colorRange={{ from: customization.gradient.colorFrom, to: customization.gradient.colorTo }}
        minBlobs={customization.gradient.blobCountMin}
        maxBlobs={customization.gradient.blobCountMax}
        blobSizeRange={{ min: customization.gradient.blobSizeMin, max: customization.gradient.blobSizeMax }}
        blobSpeedMultiplier={customization.gradient.speedMultiplier}
        visible={settings.enableGradient}
      />
      <Sidebar
        sessions={filtered}
        onNewBook={newBook}
        onNewStoryboard={newStoryboard}
        search={search}
        setSessions={setSessions}
        setSearch={setSearch}
        onSelect={handleSelect}
        currentId={currentId}
        setView={setView}
        accentHex={customization.accentHex}
        onDelete={(id) => {
          const updated = sessions.filter((s) => s.id !== id);
          setSessions(updated);

          if (id === currentId) setCurrentId(null);
          localStorage.setItem("offlineWriterSessions", JSON.stringify(updated));
        }}
      />
      {view === "layout" ? (
        <EditLayout sessions={sessions} setSessions={setSessions} />
      ) : (
        <Editor
          current={current}
          onEditTitle={handleEditTitle}
          onEditContent={handleEditContent}
          onToggleMenu={() => setMenuOpen((v) => !v)}
          accentHex={customization.accentHex}
          goalWords={settings.dailyWordGoal ?? 300}
          onStreakUpdate={handleStreakUpdate}
        />
      )}
      <BurgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        current={current}
        setSessions={setSessions}
        onOpenSettings={() => { setMenuOpen(false); setSettingsOpen(true); }}
        accentHex={customization.accentHex}
      />

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onOpenCustomizer={() => setCustomizerOpen(true)}
        onClearSessions={() => {
          setSessions([]);
          localStorage.removeItem('offlineWriterSessions');
        }}
      />
      <CustomizationSlider
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        customization={customization}
        onSave={handleSaveCustomization}
      />
      {/* Autosave indicator */}
      <div className="fixed bottom-4 right-4 flex items-center gap-3 text-white/40 text-sm select-none">
        {lastSaved && (
          <span className="transition-opacity duration-500 opacity-80">
            Saved ✓ ({lastSaved})
          </span>
        )}
        <button
          onClick={() => window.location.reload()}
          className={`p-2 rounded-full border border-white/20 hover:border-white/40 transition ${
            inactive ? "opacity-70 hover:opacity-100" : "opacity-30"
          }`}
          title="Reload from localStorage"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
