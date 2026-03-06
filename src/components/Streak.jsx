// Streak.jsx — Writing Streak System
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flame, ChevronLeft, ChevronRight, X, Target } from 'lucide-react';

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function countWords(html) {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function makeDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isKeyMet(log, key, goalWords) {
  return !!(log && log[key] !== undefined && log[key] >= goalWords);
}

export function computeStreak(log, goalWords) {
  if (!log) return 0;
  let streak = 0;
  const todayKey = getTodayKey();

  // Start from today if met, otherwise yesterday
  const todayMet = isKeyMet(log, todayKey, goalWords);
  const start = new Date();
  if (!todayMet) start.setDate(start.getDate() - 1);

  const cursor = new Date(start);
  while (true) {
    const key = makeDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    if (isKeyMet(log, key, goalWords)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── Calendar Popup ───────────────────────────────────────────────────────────

const DAY_LABELS  = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function StreakCalendar({ currentStreak, log, goalWords, accentHex, anchorRef, onClose }) {
  const today     = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const popRef   = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Position below the anchor button
  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popW = 308;
    let left = rect.left + rect.width / 2 - popW / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - popW - 8));
    const top = rect.bottom + 10;
    setPos({ top, left });
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        popRef.current    && !popRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid (Monday-first)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const startPad    = (firstDow + 6) % 7; // convert to Mon-first (0=Mon, 6=Sun)
  const cells = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = getTodayKey();

  // Returns the pill/circle style for a met day
  const getCellStyle = (day, cellIndex) => {
    if (!day) return {};
    const key = makeDateKey(viewYear, viewMonth, day);
    if (!isKeyMet(log, key, goalWords)) return {};

    const posInRow     = cellIndex % 7;
    const isFirstInRow = posInRow === 0;
    const isLastInRow  = posInRow === 6;

    const prevKey = day > 1             ? makeDateKey(viewYear, viewMonth, day - 1) : null;
    const nextKey = day < daysInMonth   ? makeDateKey(viewYear, viewMonth, day + 1) : null;

    const prevMet = !isFirstInRow && prevKey && isKeyMet(log, prevKey, goalWords);
    const nextMet = !isLastInRow  && nextKey && isKeyMet(log, nextKey, goalWords);

    const fill   = accentHex + '30';
    const border = accentHex + '90';

    if (prevMet && nextMet) {
      return {
        background: fill, borderRadius: 0,
        borderTop: `1.5px solid ${border}`, borderBottom: `1.5px solid ${border}`,
      };
    }
    if (prevMet) {
      return {
        background: fill, borderRadius: '0 50% 50% 0',
        borderTop: `1.5px solid ${border}`, borderBottom: `1.5px solid ${border}`,
        borderRight: `1.5px solid ${border}`,
      };
    }
    if (nextMet) {
      return {
        background: fill, borderRadius: '50% 0 0 50%',
        borderTop: `1.5px solid ${border}`, borderBottom: `1.5px solid ${border}`,
        borderLeft: `1.5px solid ${border}`,
      };
    }
    // Single circle
    return {
      background: fill, borderRadius: '50%',
      border: `1.5px solid ${border}`,
    };
  };

  const streakLabel =
    currentStreak === 0 ? 'No streak yet — start writing!'
    : currentStreak === 1 ? '1 day streak 🔥'
    : `${currentStreak} day streak 🔥`;

  // Word progress for today
  const todayLogged = log?.[todayKey];
  const todayMet    = isKeyMet(log, todayKey, goalWords);

  return createPortal(
    <div
      ref={popRef}
      style={{
        position: 'fixed', top: pos.top, left: pos.left,
        width: '308px', zIndex: 9999,
        background: '#111214',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        boxShadow: `0 16px 48px rgba(0,0,0,0.8), 0 0 40px ${accentHex}18`,
        padding: '20px',
        animation: 'streakFadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes streakFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .streak-nav-btn:hover { background: rgba(255,255,255,0.08) !important; color: #fff !important; }
      `}</style>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '12px', right: '12px',
          width: '24px', height: '24px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#72767d',
        }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#72767d'; }}
      >
        <X size={13} />
      </button>

      {/* Streak count */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '8px', marginBottom: '4px',
        }}>
          <Flame size={32} color={currentStreak > 0 ? accentHex : '#4f545c'} style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: '42px', fontWeight: 800, lineHeight: 1,
            color: currentStreak > 0 ? accentHex : '#4f545c',
          }}>
            {currentStreak}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#72767d', marginBottom: '6px' }}>
          {streakLabel}
        </div>

        {/* Today's progress bar */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: '8px',
          padding: '8px 12px', marginTop: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#72767d', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Today</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: todayMet ? accentHex : '#72767d' }}>
              {todayLogged ?? 0} / {goalWords} words
            </span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              background: accentHex,
              width: `${Math.min(100, ((todayLogged ?? 0) / goalWords) * 100)}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '10px',
      }}>
        <button
          className="streak-nav-btn"
          onClick={prevMonth}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#72767d', padding: '4px 6px', borderRadius: '6px',
            transition: 'all 0.1s',
          }}
        >
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#dcddde' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          className="streak-nav-btn"
          onClick={nextMonth}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#72767d', padding: '4px 6px', borderRadius: '6px',
            transition: 'all 0.1s',
          }}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '10px', fontWeight: 700,
            color: '#4f545c', padding: '2px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '2px' }}>
        {cells.map((day, i) => {
          const key       = day ? makeDateKey(viewYear, viewMonth, day) : null;
          const met       = day ? isKeyMet(log, key, goalWords) : false;
          const isToday   = key === todayKey;
          const cellStyle = getCellStyle(day, i);

          return (
            <div
              key={i}
              style={{
                height: '34px', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...cellStyle,
              }}
            >
              {day && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: isToday ? 700 : met ? 600 : 400,
                  color: met ? accentHex : isToday ? '#fff' : '#72767d',
                  position: 'relative', zIndex: 1,
                  lineHeight: 1,
                }}>
                  {day}
                </span>
              )}
              {/* Dot under today if not yet met */}
              {isToday && !met && (
                <div style={{
                  position: 'absolute', bottom: '4px', left: '50%',
                  transform: 'translateX(-50%)',
                  width: '3px', height: '3px', borderRadius: '50%',
                  background: accentHex,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Goal reminder */}
      <div style={{
        marginTop: '14px', textAlign: 'center',
        fontSize: '11px', color: '#4f545c',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
      }}>
        <Target size={11} color="#4f545c" />
        Daily goal: {goalWords} words
      </div>
    </div>,
    document.body
  );
}

// ─── FlameButton ──────────────────────────────────────────────────────────────
/**
 * Props
 * ─────
 * current         object    The active session (book). Null if none open.
 * accentHex       string    Accent color for theming.
 * goalWords       number    Daily word goal from Settings. Default 300.
 * onStreakUpdate  fn        Called with updated streak object to save back to session.
 */
export function FlameButton({ current, accentHex = '#3b82f6', goalWords = 300, onStreakUpdate }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [shaking, setShaking]           = useState(false);
  const buttonRef = useRef(null);

  const streak       = current?.streak ?? {};
  const log          = streak.log      ?? {};
  const effectiveGoal = streak.goalWords ?? goalWords;

  const todayKey   = getTodayKey();
  const todayWords = countWords(current?.content ?? '');
  const todayMet   = todayWords >= effectiveGoal;
  const currentStreak = computeStreak(log, effectiveGoal);

  const handleClick = () => {
    if (!current) return;

    // Record / update today's word count in the streak log
    if (todayMet) {
      const needsUpdate = !log[todayKey] || log[todayKey] !== todayWords;
      if (needsUpdate) {
        const updatedLog    = { ...log, [todayKey]: todayWords };
        const updatedStreak = { ...streak, goalWords: effectiveGoal, log: updatedLog };
        onStreakUpdate?.(updatedStreak);

        // Shake the flame on first daily completion
        if (!log[todayKey]) {
          setShaking(true);
          setTimeout(() => setShaking(false), 600);
        }
      }
    }

    setCalendarOpen(v => !v);
  };

  return (
    <>
      <style>{`
        @keyframes flameShake {
          0%,100% { transform: rotate(0deg)   scale(1);    }
          20%      { transform: rotate(-12deg) scale(1.15); }
          40%      { transform: rotate(12deg)  scale(1.15); }
          60%      { transform: rotate(-8deg)  scale(1.08); }
          80%      { transform: rotate(8deg)   scale(1.08); }
        }
        .flame-shaking { animation: flameShake 0.55s ease; }
      `}</style>

      <button
        ref={buttonRef}
        onClick={handleClick}
        title={
          !current
            ? 'Open a book to track your streak'
            : `${todayWords} / ${effectiveGoal} words today${todayMet ? ' ✓' : ''}`
        }
        style={{
          padding: '8px',
          border: `2px solid ${todayMet ? accentHex : 'white'}`,
          borderRadius: '6px',
          background: todayMet ? `${accentHex}15` : 'transparent',
          boxShadow: todayMet ? `0 0 14px 3px ${accentHex}44` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: current ? 'pointer' : 'default',
          transition: 'all 0.3s',
          position: 'relative',
        }}
      >
        <Flame
          size={22}
          color={todayMet ? accentHex : 'white'}
          className={shaking ? 'flame-shaking' : ''}
          style={{ transition: 'color 0.3s', display: 'block' }}
        />

        {/* Streak badge — only shown when streak > 0 */}
        {currentStreak > 0 && (
          <div style={{
            position: 'absolute', top: '-7px', right: '-7px',
            background: accentHex, color: '#fff',
            fontSize: '9px', fontWeight: 800, lineHeight: 1,
            borderRadius: '999px',
            minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            border: '2px solid #060606',
          }}>
            {currentStreak > 99 ? '99+' : currentStreak}
          </div>
        )}
      </button>

      {calendarOpen && (
        <StreakCalendar
          currentStreak={currentStreak}
          log={log}
          goalWords={effectiveGoal}
          accentHex={accentHex}
          anchorRef={buttonRef}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </>
  );
}
