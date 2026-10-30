/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Play,
  Search,
  Heart,
  RotateCcw,
  Maximize,
  Minimize,
  ExternalLink,
  Code,
  Plus,
  Shield,
  FileText,
  Star,
  Download,
  X,
  ChevronRight,
  Filter,
  Check,
  Flame,
  Info
} from 'lucide-react';

export default function App() {
  const [games, setGames] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('portal_favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [recentPlays, setRecentPlays] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('portal_recent') || '[]');
    } catch {
      return [];
    }
  });

  const [theaterMode, setTheaterMode] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(null);

  // Stealth Cloak (Panic / Disguise mode)
  const [isCloaked, setIsCloaked] = useState(false);
  const [docNotes, setDocNotes] = useState(
    'AP European History - Unit 4 Study Notes\n\n1. The Enlightenment & Social Contract Theories\n- Thomas Hobbes: Leviathan (1651) - Natural state of human life is solitary, poor, nasty, brutish, and short.\n- John Locke: Two Treatises of Government (1689) - Natural rights to life, liberty, and property; tabula rasa.\n- Montesquieu: The Spirit of the Laws (1748) - Separation of powers into legislative, executive, and judicial.\n- Jean-Jacques Rousseau: The Social Contract (1672) - The General Will and collective sovereignty.'
  );

  // Custom game form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Arcade');
  const [newDescription, setNewDescription] = useState('');
  const [newIframeInput, setNewIframeInput] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [formError, setFormError] = useState('');

  const playerRef = useRef(null);
  const iframeRef = useRef(null);

  // Load games from JSON
  useEffect(() => {
    fetch('/games.json')
      .then((res) => res.json())
      .then((data) => {
        try {
          const custom = JSON.parse(localStorage.getItem('portal_custom_games') || '[]');
          if (Array.isArray(custom) && custom.length > 0) {
            setGames([...custom, ...data]);
          } else {
            setGames(data);
          }
        } catch {
          setGames(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load games.json', err);
      });
  }, []);

  // Sync favorites
  useEffect(() => {
    localStorage.setItem('portal_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Sync recent
  useEffect(() => {
    localStorage.setItem('portal_recent', JSON.stringify(recentPlays));
  }, [recentPlays]);

  // Keyboard shortcut for Panic Key: ']'
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ']' && !['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) {
        setIsCloaked((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update tab title when cloaked
  useEffect(() => {
    if (isCloaked) {
      document.title = 'Google Docs - Unit 4 Study Notes';
    } else if (activeGame) {
      document.title = `${activeGame.title} - Portal Arcade`;
    } else {
      document.title = 'Portal Arcade - Unblocked Games';
    }
  }, [isCloaked, activeGame]);

  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLaunchGame = (game) => {
    setActiveGame(game);
    setIframeLoading(true);
    setIframeKey((k) => k + 1);
    setRecentPlays((prev) => [game.id, ...prev.filter((id) => id !== game.id)].slice(0, 8));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReloadIframe = () => {
    setIframeLoading(true);
    setIframeKey((k) => k + 1);
  };

  const handleFullscreen = () => {
    if (!playerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      playerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const handlePopout = () => {
    if (!activeGame) return;
    const win = window.open('about:blank', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Classroom</title>
          <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #000; }
            iframe { border: none; width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <iframe src="${activeGame.iframeSrc}" allowfullscreen></iframe>
        </body>
        </html>
      `);
      win.document.close();
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Add custom game
  const handleAddGame = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Please enter a game title.');
      return;
    }

    let src = newIframeInput.trim();
    if (!src) {
      setFormError('Please enter an iframe URL or embed code.');
      return;
    }

    // Extract src if full tag was pasted
    if (src.includes('<iframe')) {
      const match = src.match(/src=["']([^"']+)["']/);
      if (match && match[1]) {
        src = match[1];
      }
    }

    const newId = 'custom-' + Date.now();
    const gameObj = {
      id: newId,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Custom user embedded iframe game.',
      iframeSrc: src,
      iframeCode: `<iframe src="${src}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`,
      accentColor: newColor,
      tags: ['Custom', newCategory, 'Iframe'],
      controls: [{ key: 'Mouse / Keyboard', action: 'Standard Input' }],
      rating: 5.0,
      plays: 1,
      custom: true
    };

    const updated = [gameObj, ...games];
    setGames(updated);
    try {
      const customOnly = updated.filter((g) => g.custom);
      localStorage.setItem('portal_custom_games', JSON.stringify(customOnly));
    } catch (err) {
      console.error(err);
    }

    setShowAddModal(false);
    setNewTitle('');
    setNewDescription('');
    setNewIframeInput('');
    setFormError('');
    handleLaunchGame(gameObj);
  };

  // Export current games database as JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(games, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'games.json');
    dlAnchor.click();
    dlAnchor.remove();
  };

  // Filter & sort logic
  const categories = ['All', 'Arcade', 'Action', 'Puzzle', 'Retro', 'Classic', 'Favorites'];

  const filteredGames = games.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'Favorites') {
      return favorites.includes(g.id);
    }
    if (selectedCategory !== 'All') {
      return g.category.toLowerCase() === selectedCategory.toLowerCase();
    }
    return true;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortBy === 'popular') return b.plays - a.plays;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'az') return a.title.localeCompare(b.title);
    if (sortBy === 'recent') {
      const aIndex = recentPlays.indexOf(a.id);
      const bIndex = recentPlays.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    return 0;
  });

  const featuredGame = games.find((g) => g.featured) || games[0];

  // If Cloaked (Disguise / Panic Screen)
  if (isCloaked) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans select-text">
        {/* Google Docs style top bar */}
        <header className="border-b border-slate-200 px-4 py-2 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800 text-sm">Unit 4 Study Notes - AP Euro</span>
                <span className="text-xs text-slate-400">Saved to Drive</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600 mt-0.5">
                <span>File</span>
                <span>Edit</span>
                <span>View</span>
                <span>Insert</span>
                <span>Format</span>
                <span>Tools</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsCloaked(false)}
            className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium transition-colors"
            title="Press ] to return to games"
          >
            Exit Cloak Mode (Press ])
          </button>
        </header>

        {/* Mock Docs Document Body */}
        <div className="flex-1 bg-slate-100 p-8 flex justify-center overflow-y-auto">
          <div className="w-[800px] min-h-[900px] bg-white shadow-md border border-slate-200 p-12 rounded-sm">
            <h1 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Unit 4 Study Notes: The Enlightenment & Scientific Revolution
            </h1>
            <textarea
              value={docNotes}
              onChange={(e) => setDocNotes(e.target.value)}
              className="w-full h-[650px] outline-none text-slate-800 text-sm leading-relaxed resize-none font-serif"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col antialiased">
      {/* Top Bar Contract (§2) */}
      <header className="sticky top-0 z-40 bg-[#0d1322]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand title, one line */}
          <button
            onClick={() => { setActiveGame(null); setSelectedCategory('All'); }}
            className="flex items-center gap-2.5 text-left group shrink-0 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/25 transition-colors">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              Portal<span className="text-emerald-400">Arcade</span>
            </span>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => { setActiveGame(null); setSelectedCategory('All'); }}
              className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${!activeGame && selectedCategory === 'All' ? 'text-emerald-400 font-semibold' : ''}`}
            >
              All Games
            </button>
            <button
              onClick={() => { setActiveGame(null); setSelectedCategory('Arcade'); }}
              className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${!activeGame && selectedCategory === 'Arcade' ? 'text-emerald-400 font-semibold' : ''}`}
            >
              Arcade
            </button>
            <button
              onClick={() => { setActiveGame(null); setSelectedCategory('Action'); }}
              className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${!activeGame && selectedCategory === 'Action' ? 'text-emerald-400 font-semibold' : ''}`}
            >
              Action
            </button>
            <button
              onClick={() => { setActiveGame(null); setSelectedCategory('Puzzle'); }}
              className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${!activeGame && selectedCategory === 'Puzzle' ? 'text-emerald-400 font-semibold' : ''}`}
            >
              Puzzle
            </button>
            <button
              onClick={() => { setActiveGame(null); setSelectedCategory('Favorites'); }}
              className={`hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${!activeGame && selectedCategory === 'Favorites' ? 'text-emerald-400 font-semibold' : ''}`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
              <span>Favorites</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Add a custom game via Iframe"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Game</span>
            </button>

            <button
              onClick={() => setIsCloaked(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Quick Cloak / Disguise (Shortcut: ])"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Panic Cloak</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeGame ? (
          /* ============================================================ */
          /* GAME PLAYER VIEW                                             */
          /* ============================================================ */
          <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveGame(null)}
                  className="hover:text-white transition-colors flex items-center gap-1 text-emerald-400 font-medium"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Back to Games</span>
                </button>
                <span>·</span>
                <span>{activeGame.category}</span>
                <span>·</span>
                <span className="text-slate-200 font-medium">{activeGame.title}</span>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-slate-400">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-medium text-slate-200">{Number(activeGame.rating).toFixed(1)}</span>
                </span>
                <span>·</span>
                <span>{activeGame.plays?.toLocaleString()} plays</span>
              </div>
            </div>

            {/* Game Screen Wrapper */}
            <div
              ref={playerRef}
              className={`bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
                theaterMode ? 'w-full' : 'max-w-5xl mx-auto'
              }`}
            >
              {/* Game Toolbar */}
              <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: activeGame.accentColor }}
                  />
                  <h2 className="text-sm font-bold text-white truncate">{activeGame.title}</h2>
                  <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    {activeGame.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleReloadIframe}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Reload Game"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleFavorite(activeGame.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title={favorites.includes(activeGame.id) ? 'Remove Favorite' : 'Save Favorite'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.includes(activeGame.id) ? 'text-rose-500 fill-rose-500' : ''
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => setTheaterMode(!theaterMode)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title={theaterMode ? 'Standard Width' : 'Theater Width'}
                  >
                    {theaterMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleFullscreen}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize className="w-4 h-4 text-emerald-400" />
                  </button>

                  <button
                    onClick={handlePopout}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Open in about:blank cloaked tab"
                  >
                    <ExternalLink className="w-4 h-4 text-sky-400" />
                  </button>

                  <button
                    onClick={() => setShowEmbedModal(activeGame)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Get Iframe Embed Code"
                  >
                    <Code className="w-4 h-4 text-purple-400" />
                  </button>
                </div>
              </div>

              {/* The Iframe Player Container */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-black">
                {iframeLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3 z-10">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium tracking-wide text-slate-300">
                      Loading {activeGame.title}...
                    </span>
                  </div>
                )}
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={activeGame.iframeSrc}
                  title={activeGame.title}
                  onLoad={() => setIframeLoading(false)}
                  className="w-full h-full border-none block"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-modals allow-downloads"
                  allow="fullscreen; autoplay"
                />
              </div>
            </div>

            {/* Below Game Details & Cheatsheet */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${theaterMode ? 'w-full' : 'max-w-5xl mx-auto'}`}>
              <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
                  <h3 className="text-base font-bold text-white mb-2">Game Overview</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    {activeGame.description}
                  </p>

                  <div className="border-t border-slate-800/80 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Controls & How to Play
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeGame.controls && activeGame.controls.length > 0 ? (
                        activeGame.controls.map((ctrl, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs"
                          >
                            <span className="font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              {ctrl.key}
                            </span>
                            <span className="text-slate-300 font-medium">{ctrl.action}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400">Use standard mouse & keyboard controls.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Iframe Snippet Box */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-purple-400" />
                      <span>JSON Iframe Embed Code</span>
                    </div>
                    <code className="text-[11px] font-mono text-slate-400 truncate block">
                      {activeGame.iframeCode}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopyCode(activeGame.iframeCode)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 shrink-0 transition-colors flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Right Col: Specifications & More Games */}
              <div className="space-y-4">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Game Specifications
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Category</span>
                      <span className="text-slate-200 font-medium">{activeGame.category}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Rating</span>
                      <span className="text-amber-400 font-medium">★ {Number(activeGame.rating).toFixed(1)} / 5.0</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Total Plays</span>
                      <span className="text-slate-200 font-mono tabular-nums">{activeGame.plays?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Storage</span>
                      <span className="text-emerald-400 font-medium">JSON Iframe</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Offline Safe</span>
                      <span className="text-sky-400 font-medium">100% Unblocked</span>
                    </div>
                  </div>
                </div>

                {/* Suggested Games */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    More to Play
                  </h4>
                  <div className="space-y-2">
                    {games
                      .filter((g) => g.id !== activeGame.id)
                      .slice(0, 3)
                      .map((sug) => (
                        <button
                          key={sug.id}
                          onClick={() => handleLaunchGame(sug)}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 text-left transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: sug.accentColor }}
                            />
                            <div className="truncate">
                              <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                                {sug.title}
                              </div>
                              <div className="text-[10px] text-slate-500">{sug.category}</div>
                            </div>
                          </div>
                          <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 ml-2" />
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* GAMES DIRECTORY / HUB VIEW                                  */
          /* ============================================================ */
          <div className="space-y-8">
            {/* Hero Featured Game Spotlight */}
            {featuredGame && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 lg:p-8 shadow-xl">
                <div
                  className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: featuredGame.accentColor }}
                />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wide uppercase">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>Featured Arcade Game of the Day</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 font-normal">{featuredGame.category}</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white text-balance">
                      {featuredGame.title}
                    </h1>

                    <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                      {featuredGame.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1 text-slate-200 font-medium">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{Number(featuredGame.rating).toFixed(1)}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{featuredGame.plays?.toLocaleString()} plays</span>
                      <span aria-hidden="true">·</span>
                      <span>Sandboxed Iframe</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400">100% Unblocked</span>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleLaunchGame(featuredGame)}
                        className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Play Now</span>
                      </button>

                      <button
                        onClick={() => toggleFavorite(featuredGame.id)}
                        className={`p-2.5 rounded-lg border transition-colors ${
                          favorites.includes(featuredGame.id)
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                        title="Save to favorites"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            favorites.includes(featuredGame.id) ? 'fill-rose-400' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-4 hidden lg:flex justify-end">
                    <div className="w-full max-w-xs bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Quick Cheatsheet</span>
                        <span className="text-emerald-400">Instant Load</span>
                      </div>
                      <div className="space-y-1.5">
                        {featuredGame.controls?.slice(0, 3).map((c, i) => (
                          <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-800/60">
                            <span className="font-mono text-slate-300">{c.key}</span>
                            <span className="text-slate-400">{c.action}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <span>Stores in local JSON registry</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls Bar */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search arcade games, puzzle, tags..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="popular" className="bg-slate-900 text-slate-100">Most Popular</option>
                      <option value="rating" className="bg-slate-900 text-slate-100">Highest Rated</option>
                      <option value="az" className="bg-slate-900 text-slate-100">Alphabetical (A-Z)</option>
                      <option value="recent" className="bg-slate-900 text-slate-100">Recently Played</option>
                    </select>
                  </div>

                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 transition-colors"
                    title="Export games registry as games.json"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Export JSON</span>
                  </button>
                </div>
              </div>

              {/* Category Segmented Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800/80 rounded-lg overflow-x-auto">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {cat === 'Favorites' ? (
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5" />
                          <span>Favorites ({favorites.length})</span>
                        </span>
                      ) : (
                        cat
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Games Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong className="text-slate-200">{sortedGames.length}</strong> {selectedCategory !== 'All' ? selectedCategory : ''} games
                </span>
                {searchQuery && (
                  <span>
                    Filtered by "<span className="text-emerald-400">{searchQuery}</span>"
                  </span>
                )}
              </div>

              {sortedGames.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">No Games Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {selectedCategory === 'Favorites'
                      ? "You haven't bookmarked any games yet. Click the heart icon on any game card to add it to your favorites."
                      : "No games matched your current search filters. Try clearing your search or add a new game."}
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {sortedGames.map((game) => {
                    const isFav = favorites.includes(game.id);
                    return (
                      <div
                        key={game.id}
                        onClick={() => handleLaunchGame(game)}
                        className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div
                            className="h-28 relative flex items-center justify-center p-4 overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, ${game.accentColor}22 0%, #0f172a 100%)`,
                              borderBottom: `2px solid ${game.accentColor}44`
                            }}
                          >
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
                              style={{ backgroundColor: game.accentColor }}
                            >
                              <Gamepad2 className="w-6 h-6" />
                            </div>

                            <button
                              onClick={(e) => toggleFavorite(game.id, e)}
                              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors"
                              title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  isFav ? 'text-rose-500 fill-rose-500' : ''
                                }`}
                              />
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); setShowEmbedModal(game); }}
                              className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-purple-400 transition-colors"
                              title="View Iframe Code"
                            >
                              <Code className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="p-4 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                                {game.title}
                              </h3>
                              <span className="text-[11px] font-medium text-slate-400 shrink-0">
                                {game.category}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {game.description}
                            </p>
                          </div>
                        </div>

                        <div className="px-4 pb-4 pt-2 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-slate-300 font-medium">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>{Number(game.rating).toFixed(1)}</span>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{game.plays?.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center gap-1 text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                            <span>Play</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/70 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Portal Arcade</span>
            <span>— Lightweight HTML/JS Unblocked Games with JSON Iframe Storage</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Panic Key: Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px] border border-slate-700">]</kbd> to Cloak</span>
            <span>·</span>
            <span>No Ads</span>
            <span>·</span>
            <span>No AI Features</span>
          </div>
        </div>
      </footer>

      {/* Add Custom Game Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Add Game to Registry</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddGame} className="space-y-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Game Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Space Odyssey 2D"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Arcade">Arcade</option>
                    <option value="Action">Action</option>
                    <option value="Puzzle">Puzzle</option>
                    <option value="Retro">Retro</option>
                    <option value="Classic">Classic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-10 h-9 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{newColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief summary of the gameplay..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Iframe Source URL or &lt;iframe&gt; Code *
                </label>
                <input
                  type="text"
                  value={newIframeInput}
                  onChange={(e) => setNewIframeInput(e.target.value)}
                  placeholder="e.g. /games/snake.html or <iframe src='...'></iframe>"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  You can paste a relative path, HTTPS web URL, or an HTML iframe embed tag.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400"
                >
                  Save & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embed Code Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Iframe Embed Code</h3>
              </div>
              <button
                onClick={() => setShowEmbedModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Copy this standard iframe code to embed <strong>{showEmbedModal.title}</strong> into your own HTML page, Google Sites, or portal:
            </p>

            <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-3">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap break-all">
                {showEmbedModal.iframeCode}
              </pre>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Direct Source Path:</span>
                <code className="text-slate-300 font-mono">{showEmbedModal.iframeSrc}</code>
              </div>
              <div className="flex justify-between">
                <span>Stored In:</span>
                <span className="text-slate-300">/public/games.json</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleCopyCode(showEmbedModal.iframeCode)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Embed Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
