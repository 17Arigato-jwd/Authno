import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, User, Palette, Database, BookOpen,
  Camera, Check, Trash2, RefreshCw, AlertTriangle,
  BookMarked, FilePlus, ChevronRight, Zap, Sliders, Sun, Target,
} from 'lucide-react';
import { buildPalette } from './Background';
import { ColorPicker } from './ColorPicker';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_PRESETS = [
  { label: 'Ember',   hex: '#ff4500' },
  { label: 'Ocean',   hex: '#3b82f6' },
  { label: 'Sage',    hex: '#22c55e' },
  { label: 'Violet',  hex: '#a855f7' },
  { label: 'Rose',    hex: '#ec4899' },
  { label: 'Gold',    hex: '#f59e0b' },
];

const NAV_ITEMS = [
  { id: 'profile',    label: 'Profile',          icon: User,     group: 'User' },
  { id: 'appearance', label: 'Appearance',        icon: Palette,  group: 'User' },
  { id: 'writing',    label: 'Writing Goal',      icon: Target,   group: 'User' },
  { id: 'startup',    label: 'Startup Behavior',  icon: BookOpen, group: 'App'  },
  { id: 'data',       label: 'Data Management',   icon: Database, group: 'App'  },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '4px', letterSpacing: '-0.3px' }}>
      {children}
    </h2>
  );
}

function SectionSubtitle({ children }) {
  return <p style={{ fontSize: '13px', color: '#72767d', marginBottom: '24px' }}>{children}</p>;
}

function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />;
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 700, color: '#b9bbbe',
      textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px',
    }}>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, accentHex }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        backgroundColor: checked ? accentHex : '#4f545c',
        cursor: 'pointer', padding: '3px',
        transition: 'background-color 0.2s ease',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%',
        backgroundColor: '#fff',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.2s ease',
      }} />
    </div>
  );
}

function SettingRow({ icon: Icon, title, description, children, accentHex }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderRadius: '8px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        {Icon && (
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: `${accentHex}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={15} color={accentHex} />
          </div>
        )}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#dcddde' }}>{title}</div>
          {description && <div style={{ fontSize: '12px', color: '#72767d', marginTop: '2px' }}>{description}</div>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function ConfirmModal({ title, message, type, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#1a1b1e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <AlertTriangle size={20} color={type === 'danger' ? '#ed4245' : '#faa61a'} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{title}</span>
        </div>
        <p style={{ fontSize: '14px', color: '#b9bbbe', lineHeight: 1.5, marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none',
            background: 'rgba(255,255,255,0.1)', color: '#dcddde',
            cursor: 'pointer', fontSize: '14px', fontWeight: 500,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none',
            background: type === 'danger' ? '#ed4245' : '#faa61a',
            color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Panels ───────────────────────────────────────────────────────────

function ProfilePanel({ settings, onChange, accentHex }) {
  const fileRef = useRef(null);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onChange({ avatarDataUrl: reader.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div>
      <SectionTitle>Profile</SectionTitle>
      <SectionSubtitle>Manage how you appear in the app.</SectionSubtitle>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
            border: `3px solid ${accentHex}`,
            background: 'linear-gradient(135deg, #4f545c, #36393f)',
          }}>
            {settings.avatarDataUrl ? (
              <img src={settings.avatarDataUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={32} color="#72767d" />
              </div>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '26px', height: '26px', borderRadius: '50%',
              background: accentHex, border: '2px solid #1a1b1e',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Camera size={12} color="#fff" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
            {settings.displayName || 'Anonymous'}
          </div>
          <div style={{ fontSize: '12px', color: '#72767d', marginTop: '2px' }}>
            Click the camera to update your avatar
          </div>
        </div>
      </div>

      <Label>Display Name</Label>
      <input
        value={settings.displayName || ''}
        onChange={(e) => onChange({ displayName: e.target.value })}
        placeholder="Your name"
        style={{
          width: '100%', padding: '10px 14px',
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', color: '#dcddde', fontSize: '14px',
          outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = accentHex}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />

      {settings.avatarDataUrl && (
        <>
          <Divider />
          <button
            onClick={() => onChange({ avatarDataUrl: null })}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              background: 'rgba(237,66,69,0.15)', border: '1px solid rgba(237,66,69,0.3)',
              color: '#ed4245', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            }}
          >
            Remove Avatar
          </button>
        </>
      )}
    </div>
  );
}

function AppearancePanel({ settings, onChange, accentHex, onOpenCustomizer }) {
  const [customHex, setCustomHex] = useState(settings.accentHex || '#3b82f6');
  const isCustom = !ACCENT_PRESETS.some(p => p.hex === settings.accentHex);

  return (
    <div>
      <SectionTitle>Appearance</SectionTitle>
      <SectionSubtitle>Personalise the look and feel of the editor.</SectionSubtitle>

      {/* ── Accent Color ── */}
      <Label>Accent Color</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        {ACCENT_PRESETS.map(preset => (
          <button
            key={preset.hex}
            onClick={() => onChange({ accentHex: preset.hex })}
            title={preset.label}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: preset.hex, border: 'none', cursor: 'pointer',
              outline: settings.accentHex === preset.hex ? '3px solid #fff' : '3px solid transparent',
              outlineOffset: '2px',
              transition: 'outline 0.15s, transform 0.15s',
              transform: settings.accentHex === preset.hex ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}
        <ColorPicker
          value={settings.accentHex || '#3b82f6'}
          onChange={(hex) => { setCustomHex(hex); onChange({ accentHex: hex }); }}
        />
      </div>

      {/* Palette preview */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {Object.entries(buildPalette(settings.accentHex || accentHex)).map(([key, val]) => (
          <div key={key} style={{ flex: 1, borderRadius: '6px', height: '24px', background: val }} title={key} />
        ))}
      </div>

      <Divider />

      {/* ── Effects ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <SettingRow
          icon={Zap}
          title="Gradient Background"
          description="Animated ambient blobs behind the interface"
          accentHex={accentHex}
        >
          <Toggle
            checked={settings.enableGradient ?? false}
            onChange={(v) => onChange({ enableGradient: v })}
            accentHex={accentHex}
          />
        </SettingRow>

        <SettingRow
          icon={Sun}
          title="Light Mode"
          description="Switch to a light colour scheme"
          accentHex={accentHex}
        >
          <Toggle
            checked={settings.lightMode ?? false}
            onChange={(v) => onChange({ lightMode: v })}
            accentHex={accentHex}
          />
        </SettingRow>

        {/* Spacer before customizer */}
        <div style={{ height: '8px' }} />

        <SettingRow
          icon={Sliders}
          title="Gradient Customizer"
          description="Fine-tune blobs, colours, and speed"
          accentHex={accentHex}
        >
          <button
            onClick={onOpenCustomizer}
            style={{
              padding: '6px 14px', borderRadius: '7px', border: 'none',
              background: `${accentHex}22`,
              color: accentHex,
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '4px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${accentHex}44`}
            onMouseLeave={e => e.currentTarget.style.background = `${accentHex}22`}
          >
            Open <ChevronRight size={14} />
          </button>
        </SettingRow>
      </div>
    </div>
  );
}

function StartupPanel({ settings, onChange, accentHex }) {
  const options = [
    { id: 'last',  icon: BookMarked, title: 'Reopen last book',    description: 'Pick up exactly where you left off' },
    { id: 'blank', icon: FilePlus,   title: 'Open a blank book',   description: 'Start fresh every time you launch'  },
    { id: 'none',  icon: BookOpen,   title: 'Show empty editor',   description: 'No book loaded — choose manually'   },
  ];

  return (
    <div>
      <SectionTitle>Startup Behavior</SectionTitle>
      <SectionSubtitle>Choose what happens when the app launches.</SectionSubtitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {options.map(opt => {
          const selected = (settings.startupBehavior ?? 'last') === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => onChange({ startupBehavior: opt.id })}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', borderRadius: '10px',
                border: `1px solid ${selected ? accentHex + '80' : 'rgba(255,255,255,0.06)'}`,
                background: selected ? `${accentHex}14` : 'rgba(255,255,255,0.02)',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: selected ? `${accentHex}30` : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <opt.icon size={17} color={selected ? accentHex : '#72767d'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: selected ? '#fff' : '#dcddde' }}>{opt.title}</div>
                <div style={{ fontSize: '12px', color: '#72767d', marginTop: '2px' }}>{opt.description}</div>
              </div>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: `2px solid ${selected ? accentHex : '#4f545c'}`,
                background: selected ? accentHex : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
                {selected && <Check size={10} color="#fff" />}
              </div>
            </div>
          );
        })}
      </div>

      <Divider />

      <Label>Session Persistence</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <SettingRow
          icon={BookOpen}
          title="Restore previously open books"
          description="Re-open all books that were open last session"
          accentHex={accentHex}
        >
          <Toggle
            checked={settings.restoreOpenBooks ?? true}
            onChange={(v) => onChange({ restoreOpenBooks: v })}
            accentHex={accentHex}
          />
        </SettingRow>
      </div>
    </div>
  );
}

function WritingGoalPanel({ settings, onChange, accentHex }) {
  const goal = settings.dailyWordGoal ?? 500;
  const [inputVal, setInputVal] = useState(String(goal));

  const commit = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n > 0) onChange({ dailyWordGoal: n });
    else setInputVal(String(goal));
  };

  const presets = [100, 300, 500, 1000, 1500];

  return (
    <div>
      <SectionTitle>Writing Goal</SectionTitle>
      <SectionSubtitle>Set how many words you need to write each day to keep your streak alive.</SectionSubtitle>

      <Label>Daily Word Goal</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <input
          type="number"
          min="1"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && commit()}
          style={{
            width: '110px', padding: '10px 14px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', color: '#dcddde',
            fontSize: '20px', fontWeight: 700,
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = accentHex}
          onBlur2={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <span style={{ fontSize: '14px', color: '#72767d' }}>words per day</span>
      </div>

      {/* Quick presets */}
      <Label>Quick Presets</Label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {presets.map(p => (
          <button
            key={p}
            onClick={() => { onChange({ dailyWordGoal: p }); setInputVal(String(p)); }}
            style={{
              padding: '6px 16px', borderRadius: '20px',
              border: `1.5px solid ${goal === p ? accentHex : 'rgba(255,255,255,0.12)'}`,
              background: goal === p ? `${accentHex}20` : 'transparent',
              color: goal === p ? accentHex : '#96989d',
              cursor: 'pointer', fontSize: '13px', fontWeight: goal === p ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <Divider />

      {/* Context */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px', padding: '14px 16px',
      }}>
        <div style={{ fontSize: '12px', color: '#72767d', lineHeight: 1.7 }}>
          <div>📖 <strong style={{ color: '#b9bbbe' }}>150 words</strong> — A short journal entry</div>
          <div>✍️ <strong style={{ color: '#b9bbbe' }}>500 words</strong> — A focused session</div>
          <div>🔥 <strong style={{ color: '#b9bbbe' }}>1000 words</strong> — A strong daily output</div>
          <div>⚡ <strong style={{ color: '#b9bbbe' }}>1500 words</strong> — An Average Webnovel Chapter</div>
        </div>
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#4f545c' }}>
        Your streak data is saved inside each <code style={{ color: '#72767d' }}>.authbook</code> file and is unique per book.
      </div>
    </div>
  );
}

function DataPanel({ settings, onChange, accentHex, onClearSessions }) {
  const [confirm, setConfirm] = useState(null);

  const actions = [
    {
      id: 'clearSessions',
      icon: Trash2,
      label: 'Clear All Sessions',
      description: 'Removes all writing sessions from local storage',
      color: '#ed4245',
      modal: {
        title: 'Clear All Sessions?',
        message: 'This will permanently delete all your writing sessions. Your files on disk will not be affected, but all in-app history will be lost.',
        type: 'danger',
        onConfirm: () => { onClearSessions(); setConfirm(null); },
      },
    },
    {
      id: 'resetSettings',
      icon: RefreshCw,
      label: 'Reset Settings to Default',
      description: 'Resets appearance, startup, and profile to defaults',
      color: '#faa61a',
      modal: {
        title: 'Reset All Settings?',
        message: 'Your profile, appearance, and startup preferences will be restored to their defaults. Sessions will not be affected.',
        type: 'warning',
        onConfirm: () => {
          onChange({
            displayName: '', avatarDataUrl: null,
            accentHex: '#3b82f6', enableGradient: false,
            lightMode: false, startupBehavior: 'last', restoreOpenBooks: true,
          });
          setConfirm(null);
        },
      },
    },
  ];

  return (
    <div>
      <SectionTitle>Data Management</SectionTitle>
      <SectionSubtitle>Manage stored data and reset the application state.</SectionSubtitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {actions.map(action => (
          <div
            key={action.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: '10px',
              border: `1px solid ${action.color}22`,
              background: `${action.color}0a`, gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: `${action.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <action.icon size={15} color={action.color} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#dcddde' }}>{action.label}</div>
                <div style={{ fontSize: '12px', color: '#72767d', marginTop: '2px' }}>{action.description}</div>
              </div>
            </div>
            <button
              onClick={() => setConfirm(action.modal)}
              style={{
                padding: '7px 16px', borderRadius: '7px', border: `1px solid ${action.color}44`,
                background: `${action.color}18`, color: action.color,
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              {action.label.split(' ')[0]}
            </button>
          </div>
        ))}
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          type={confirm.type}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  displayName: '',
  avatarDataUrl: null,
  accentHex: '#5a00d9',
  enableGradient: false,
  lightMode: false,
  startupBehavior: 'last',
  restoreOpenBooks: true,
  dailyWordGoal: 500,
};

export function Settings({ isOpen, onClose, settings = DEFAULT_SETTINGS, onSave, onClearSessions, onOpenCustomizer }) {
  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleChange = useCallback((patch) => {
    onSave?.({ ...settings, ...patch });
  }, [settings, onSave]);

  if (!isOpen) return null;

  const accentHex = settings.accentHex || '#3b82f6';
  const groups = [...new Set(NAV_ITEMS.map(i => i.group))];
  const panelProps = { settings, onChange: handleChange, accentHex };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        animation: 'settingsFadeIn 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes settingsFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes settingsPanelIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .settings-nav-item:hover { background: rgba(255,255,255,0.05) !important; color: #dcddde !important; }
      `}</style>

      <div style={{
        width: '90vw', maxWidth: '860px',
        height: '80vh', maxHeight: '680px',
        display: 'flex', borderRadius: '16px', overflow: 'hidden',
        background: '#1a1b1e',                               /* ← darkened from #2b2d31 */
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        animation: 'settingsPanelIn 0.2s ease',
      }}>

        {/* ── Left Nav ── */}
        <div style={{
          width: '220px', flexShrink: 0,
          background: '#111214',                             /* ← darkened from #1e1f22 */
          padding: '16px 8px',
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflowY: 'auto',
        }}>
          {groups.map(group => (
            <div key={group} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, color: '#72767d',
                textTransform: 'uppercase', letterSpacing: '0.8px',
                padding: '4px 10px', marginBottom: '4px',
              }}>
                {group}
              </div>
              {NAV_ITEMS.filter(i => i.group === group).map(item => {
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    className="settings-nav-item"
                    onClick={() => setActiveSection(item.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '6px', border: 'none',
                      background: active ? `${accentHex}22` : 'transparent',
                      color: active ? '#fff' : '#96989d',
                      cursor: 'pointer', fontSize: '14px', fontWeight: active ? 600 : 400,
                      textAlign: 'left', transition: 'all 0.1s ease',
                    }}
                  >
                    <item.icon size={16} color={active ? accentHex : '#72767d'} />
                    {item.label}
                    {active && (
                      <div style={{ marginLeft: 'auto', width: '3px', height: '16px', borderRadius: '2px', background: accentHex }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          <div style={{ marginTop: 'auto', padding: '8px 10px', fontSize: '11px', color: '#4f545c' }}>
            Settings v1.0
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#72767d', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#72767d'; }}
          >
            <X size={16} />
          </button>

          {activeSection === 'profile'    && <ProfilePanel    {...panelProps} />}
          {activeSection === 'appearance' && <AppearancePanel {...panelProps} onOpenCustomizer={onOpenCustomizer} />}
          {activeSection === 'writing'    && <WritingGoalPanel {...panelProps} />}
          {activeSection === 'startup'    && <StartupPanel    {...panelProps} />}
          {activeSection === 'data'       && <DataPanel       {...panelProps} onClearSessions={onClearSessions} />}
        </div>
      </div>
    </div>
  );
}
