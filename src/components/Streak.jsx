// Streak.jsx — Writing Streak System
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flame, ChevronLeft, ChevronRight, X, Target, CheckCircle2, XCircle } from 'lucide-react';

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

/**
 * Log entry shape: { words: number, goal: number }
 *
 * Each day stores the goal that was active on that day so retroactive
 * goal changes never alter past results.
 *
 * Legacy support: if a day was saved as a plain number (old format),
 * it is treated as met (it was only saved on completion).
 */
function getEntry(log, key) {
  const e = log?.[key];
  if (e == null) return null;
  if (typeof e === 'number') return { words: e, goal: null }; // legacy
  return e;
}

function isEntryMet(entry) {
  if (!entry) return false;
  if (entry.goal === null) return true; // legacy entries count as met
  return entry.words >= entry.goal;
}

function isKeyMet(log, key) {
  return isEntryMet(getEntry(log, key));
}

export function computeStreak(log) {
  if (!log) return 0;
  let streak = 0;
  const todayKey = getTodayKey();
  const todayMet = isKeyMet(log, todayKey);

  const cursor = new Date();
  if (!todayMet) cursor.setDate(cursor.getDate() - 1);

  while (true) {
    const key = makeDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    if (isKeyMet(log, key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── Day Tooltip ──────────────────────────────────────────────────────────────

function DayTooltip({ entry, dayLabel, accentHex, cellRef }) {
  const tipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, ready: false });

  useEffect(() => {
    if (!cellRef?.current || !tipRef.current) return;
    const cell = cellRef.current.getBoundingClientRect();
    const tip  = tipRef.current.getBoundingClientRect();
    let left = cell.left + cell.width / 2 - tip.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tip.width - 8));
    const top = cell.top - tip.height - 8;
    setPos({ top, left, ready: true });
  }, [cellRef]);

  const met   = isEntryMet(entry);
  const words = entry?.words ?? 0;
  const goal  = entry?.goal  ?? null;

  return createPortal(
    <div
      ref={tipRef}
      style={{
        position:   'fixed',
        top:        pos.top,
        left:       pos.left,
        zIndex:     10000,
        opacity:    pos.ready ? 1 : 0,
        background: '#1a1b1e',
        border:     `1px solid ${met ? accentHex + '55' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '8px',
        padding:    '7px 11px',
        pointerEvents: 'none',
        boxShadow:  '0 8px 24px rgba(0,0,0,0.7)',
        whiteSpace: 'nowrap',
        transition: 'opacity 0.08s ease',
      }}
    >
      <div style={{ fontSize: '11px', color: '#72767d', marginBottom: '4px' }}>{dayLabel}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {met
          ? <CheckCircle2 size={12} color={accentHex} />
          : <XCircle      size={12} color="#4f545c"   />
        }
        <span style={{ fontSize: '13px', fontWeight: 700, color: met ? accentHex : '#72767d' }}>
          {words.toLocaleString()}
        </span>
        {goal !== null && (
          <span style={{ fontSize: '10px', fontWeight: 500, color: '#4f545c', lineHeight: 1, alignSelf: 'flex-end', marginBottom: '1px' }}>
            /{goal.toLocaleString()}
          </span>
        )}
        <span style={{ fontSize: '11px', color: '#4f545c' }}>words</span>
      </div>
    </div>,
    document.body
  );
}

// ─── Calendar Cell ────────────────────────────────────────────────────────────

function CalendarCell({ day, cellIndex, daysInMonth, viewYear, viewMonth, log, accentHex, todayKey }) {
  const [hovered, setHovered] = useState(false);
  const cellRef = useRef(null);

  if (!day) return <div style={{ height: '34px' }} />;

  const key     = makeDateKey(viewYear, viewMonth, day);
  const entry   = getEntry(log, key);
  const met     = isEntryMet(entry);
  const isToday = key === todayKey;
  const hasData = !!entry;

  // Pill/circle calculation
  const posInRow     = cellIndex % 7;
  const isFirstInRow = posInRow === 0;
  const isLastInRow  = posInRow === 6;
  const prevKey      = day > 1           ? makeDateKey(viewYear, viewMonth, day - 1) : null;
  const nextKey      = day < daysInMonth ? makeDateKey(viewYear, viewMonth, day + 1) : null;
  const prevMet      = !isFirstInRow && prevKey && isKeyMet(log, prevKey);
  const nextMet      = !isLastInRow  && nextKey && isKeyMet(log, nextKey);

  const fill   = accentHex + '30';
  const border = accentHex + '90';

  let cellStyle = {};
  if (met) {
    if (prevMet && nextMet) {
      cellStyle = { background: fill, borderRadius: 0, borderTop: `1.5px solid ${border}`, borderBottom: `1.5px solid ${border}` };
    } else if (prevMet) {
      cellStyle = { background: fill, borderRadius: '0 50% 50% 0', borderTop: `1.5px solid ${border}`, borderBottom: `1.5px solid ${border}`, borderRight: `1.5px solid ${border}` };
    } else if (nextMet) {
      cellStyle = { background: fill, borderRadius: '50% 0 0 50%', borderTop: `1.5px solid ${border}`, borderBottom: `1.5px solid ${border}`, borderLeft: `1.5px solid ${border}` };
    } else {
      cellStyle = { background: fill, borderRadius: '50%', border: `1.5px solid ${border}` };
    }
  }

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayLabel = `${MONTH_NAMES[viewMonth]} ${day}, ${viewYear}`;

  return (
    <div
      ref={cellRef}
      onMouseEnter={() => hasData && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: '34px', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...cellStyle,
      }}
    >
      <span style={{
        fontSize: '12px',
        fontWeight: isToday ? 700 : met ? 600 : 400,
        color: met ? accentHex : isToday ? '#fff' : '#72767d',
        position: 'relative', zIndex: 1, lineHeight: 1,
      }}>
        {day}
      </span>

      {/* Dot under today if goal not yet met */}
      {isToday && !met && (
        <div style={{
          position: 'absolute', bottom: '4px', left: '50%',
          transform: 'translateX(-50%)',
          width: '3px', height: '3px', borderRadius: '50%',
          background: accentHex,
        }} />
      )}

      {hovered && hasData && (
        <DayTooltip
          entry={entry}
          dayLabel={dayLabel}
          accentHex={accentHex}
          cellRef={cellRef}
        />
      )}
    </div>
  );
}

// ─── Calendar Popup ───────────────────────────────────────────────────────────

const DAY_LABELS  = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function StreakCalendar({ currentStreak, log, todayWords, goalWords, accentHex, anchorRef, onClose }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const popRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popW = 308;
    let left = rect.left + rect.width / 2 - popW / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - popW - 8));
    setPos({ top: rect.bottom + 10, left });
  }, [anchorRef]);

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

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
  const startPad    = (firstDow + 6) % 7;
  const cells = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey   = getTodayKey();
  const todayEntry = getEntry(log, todayKey);
  const todayMet   = isEntryMet(todayEntry);
  // Show the goal stored for today if already logged, else the current setting
  const displayGoal = todayEntry?.goal ?? goalWords;

  const streakLabel =
    currentStreak === 0 ? 'No streak yet — start writing!'
    : currentStreak === 1 ? '1 day streak 🔥'
    : `${currentStreak} day streak 🔥`;

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <Flame size={32} color={currentStreak > 0 ? accentHex : '#4f545c'} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: currentStreak > 0 ? accentHex : '#4f545c' }}>
            {currentStreak}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#72767d', marginBottom: '8px' }}>{streakLabel}</div>

        {/* Today's progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#72767d', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Today</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: todayMet ? accentHex : '#72767d' }}>
              {todayWords.toLocaleString()} / {displayGoal.toLocaleString()} words
            </span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '2px', background: accentHex,
              width: `${Math.min(100, (todayWords / displayGoal) * 100)}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button className="streak-nav-btn" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#72767d', padding: '4px 6px', borderRadius: '6px', transition: 'all 0.1s' }}>
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#dcddde' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button className="streak-nav-btn" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#72767d', padding: '4px 6px', borderRadius: '6px', transition: 'all 0.1s' }}>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#4f545c', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '2px' }}>
        {cells.map((day, i) => (
          <CalendarCell
            key={i}
            day={day}
            cellIndex={i}
            daysInMonth={daysInMonth}
            viewYear={viewYear}
            viewMonth={viewMonth}
            log={log}
            accentHex={accentHex}
            todayKey={todayKey}
          />
        ))}
      </div>

      <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '11px', color: '#4f545c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <Target size={11} color="#4f545c" />
        Current goal: {goalWords.toLocaleString()} words/day
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

  const streak     = current?.streak ?? {};
  const log        = streak.log      ?? {};
  const todayKey   = getTodayKey();
  const todayWords = countWords(current?.content ?? '');
  const todayMet   = todayWords >= goalWords;
  const currentStreak = computeStreak(log);

  const handleClick = () => {
    if (!current) return;

    if (todayMet) {
      const existing   = getEntry(log, todayKey);
      const needsWrite = !existing || existing.words !== todayWords || existing.goal !== goalWords;

      if (needsWrite) {
        // Freeze today's goal alongside today's word count
        const updatedLog    = { ...log, [todayKey]: { words: todayWords, goal: goalWords } };
        const updatedStreak = { ...streak, log: updatedLog };
        onStreakUpdate?.(updatedStreak);

        // Shake on first completion of the day
        if (!isEntryMet(existing)) {
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
            : `${todayWords.toLocaleString()} / ${goalWords.toLocaleString()} words today${todayMet ? ' ✓' : ''}`
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

        {currentStreak > 0 && (
          <div style={{
            position: 'absolute', top: '-7px', right: '-7px',
            background: accentHex, color: '#fff',
            fontSize: '9px', fontWeight: 800, lineHeight: 1,
            borderRadius: '999px', minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', border: '2px solid #060606',
          }}>
            {currentStreak > 99 ? '99+' : currentStreak}
          </div>
        )}
      </button>

      {calendarOpen && (
        <StreakCalendar
          currentStreak={currentStreak}
          log={log}
          todayWords={todayWords}
          goalWords={goalWords}
          accentHex={accentHex}
          anchorRef={buttonRef}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </>
  );
}
