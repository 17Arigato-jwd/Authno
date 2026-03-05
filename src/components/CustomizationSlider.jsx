import { useState, useEffect, useCallback } from 'react';
import { X, Sliders, Sparkles, ChevronRight } from 'lucide-react';
import Background from "./Background";
// ─── Colour math helpers ──────────────────────────────────────────────────────

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToHue(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else                h = ((r - g) / d + 4) / 6;
  return Math.round(h * 360);
}

// ─── Default state ────────────────────────────────────────────────────────────

export const DEFAULT_CUSTOMIZATION = {
  accentHex:         '#3b82f6',
  backgroundOpacity: 1.0,
  gradient: {
    colorFrom:          '#3b82f6',
    colorTo:            '#ec4899',
    blobCountMin:       7,
    blobCountMax:       9,
    blobSizeMin:        20,
    blobSizeMax:        450,
    speedMultiplier:    1.0,
  },
};

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'background', label: 'Background',           icon: Sliders,   group: 'Colors'   },
  { id: 'gradient',   label: 'Gradient Customizer',  icon: Sparkles,  group: 'Effects'  },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px', letterSpacing: '-0.3px' }}>
      {children}
    </h2>
  );
}

function SectionSubtitle({ children }) {
  return <p style={{ fontSize: '13px', color: '#72767d', marginBottom: '28px' }}>{children}</p>;
}

function Label({ children, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#b9bbbe', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {children}
      </span>
      {right && <span style={{ fontSize: '12px', color: '#72767d', fontVariantNumeric: 'tabular-nums' }}>{right}</span>}
    </div>
  );
}

function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />;
}

// ─── Track-styled range slider ────────────────────────────────────────────────
// Renders the filled portion using a CSS linear-gradient on the track.

function StyledSlider({ min, max, step = 1, value, onChange, trackGradient, accentHex }) {
  const pct = ((value - min) / (max - min)) * 100;
  const gradient = trackGradient
    ?? `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`;

  return (
    <>
      <style>{`
        .cslider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.1s;
        }
        .cslider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .cslider::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff; border: none; cursor: pointer;
        }
        .cslider { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px; outline: none; cursor: pointer; }
      `}</style>
      <input
        type="range"
        className="cslider"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', background: gradient }}
      />
    </>
  );
}

// Dual-thumb slider (min/max) — two overlapping native inputs
function DualSlider({ min, max, step = 1, valueMin, valueMax, onChangeMin, onChangeMax, accentHex }) {
  const pctMin = ((valueMin - min) / (max - min)) * 100;
  const pctMax = ((valueMax - min) / (max - min)) * 100;
  const track = `linear-gradient(to right,
    rgba(255,255,255,0.12) 0%,
    rgba(255,255,255,0.12) ${pctMin}%,
    ${accentHex} ${pctMin}%,
    ${accentHex} ${pctMax}%,
    rgba(255,255,255,0.12) ${pctMax}%,
    rgba(255,255,255,0.12) 100%)`;

  const shared = {
    position: 'absolute', inset: 0,
    width: '100%', height: '6px',
    appearance: 'none', WebkitAppearance: 'none',
    background: 'transparent', outline: 'none', cursor: 'pointer',
    pointerEvents: 'none',
  };

  return (
    <div style={{ position: 'relative', height: '6px', borderRadius: '3px', background: track }}>
      <style>{`
        .dslider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff; box-shadow: 0 0 0 3px rgba(0,0,0,0.4);
          pointer-events: all; cursor: pointer; transition: transform 0.1s;
        }
        .dslider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .dslider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #fff; border: none; pointer-events: all; cursor: pointer; }
      `}</style>
      <input type="range" className="dslider" min={min} max={max} step={step} value={valueMin}
        onChange={e => { const v = Math.min(Number(e.target.value), valueMax - step); onChangeMin(v); }}
        style={shared}
      />
      <input type="range" className="dslider" min={min} max={max} step={step} value={valueMax}
        onChange={e => { const v = Math.max(Number(e.target.value), valueMin + step); onChangeMax(v); }}
        style={shared}
      />
    </div>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function AccentPanel({ customization, onChange, accentHex }) {
  const currentHue = hexToHue(customization.accentHex ?? accentHex);

  const hueGradient = Array.from({ length: 7 }, (_, i) => `hsl(${i * 60},75%,55%)`).join(',');

  return (
    <div>
      <SectionTitle>Accent Color</SectionTitle>
      <SectionSubtitle>Drag the hue slider to set your accent colour.</SectionSubtitle>

      {/* Big colour preview */}
      <div style={{
        height: '80px', borderRadius: '12px', marginBottom: '24px',
        background: `linear-gradient(135deg, ${hslToHex(currentHue, 75, 35)}, ${hslToHex(currentHue, 75, 55)}, ${hslToHex(currentHue, 60, 70)})`,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `0 0 40px ${hslToHex(currentHue, 75, 55)}55`,
        transition: 'background 0.1s, box-shadow 0.1s',
      }} />

      <Label right={`${currentHue}°`}>Hue</Label>
      <StyledSlider
        min={0} max={359} step={1}
        value={currentHue}
        accentHex={hslToHex(currentHue, 75, 55)}
        trackGradient={`linear-gradient(to right, ${hueGradient})`}
        onChange={hue => onChange({ accentHex: hslToHex(hue, 75, 55) })}
      />

      <Divider />

      {/* Quick presets */}
      <Label>Quick Presets</Label>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[0, 30, 120, 200, 260, 320].map(hue => {
          const hex = hslToHex(hue, 75, 55);
          const active = Math.abs(currentHue - hue) < 8;
          return (
            <button
              key={hue}
              onClick={() => onChange({ accentHex: hex })}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: hex, border: 'none', cursor: 'pointer',
                outline: active ? '3px solid #fff' : '3px solid transparent',
                outlineOffset: '2px',
                transform: active ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function BackgroundPanel({ customization, onChange, accentHex }) {
  const opacity = customization.backgroundOpacity ?? 1;

  return (
    <div>
      <SectionTitle>Background</SectionTitle>
      <SectionSubtitle>Control how intense the background effect appears.</SectionSubtitle>

      {/* Opacity preview strip */}
      <div style={{
        height: '80px', borderRadius: '12px', marginBottom: '24px',
        position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Checkerboard base to show transparency */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${accentHex}88, #000)`,
          opacity,
          transition: 'opacity 0.1s',
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {Math.round(opacity * 100)}% opacity
          </span>
        </div>
      </div>

      <Label right={`${Math.round(opacity * 100)}%`}>Opacity</Label>
      <StyledSlider
        min={0} max={1} step={0.01}
        value={opacity}
        accentHex={accentHex}
        onChange={v => onChange({ backgroundOpacity: v })}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: '#4f545c' }}>Hidden</span>
        <span style={{ fontSize: '11px', color: '#4f545c' }}>Full</span>
      </div>
    </div>
  );
}

function GradientPanel({ customization, onChange, accentHex }) {
  const g = customization.gradient ?? DEFAULT_CUSTOMIZATION.gradient;

  const update = patch => onChange({ gradient: { ...g, ...patch } });

  const gradientPreview = `linear-gradient(to right, ${g.colorFrom}, ${g.colorTo})`;

  return (
    <div>
      <SectionTitle>Gradient Customizer</SectionTitle>
      <SectionSubtitle>Fine-tune how the animated blobs look and behave.</SectionSubtitle>

      {/* ── Colour Range ── */}
      <Label>Blob Color Range</Label>
      <div style={{
        height: '40px', borderRadius: '8px', marginBottom: '16px',
        background: gradientPreview,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `0 0 20px ${g.colorFrom}33, 0 0 20px ${g.colorTo}33`,
        transition: 'background 0.15s',
      }} />

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {/* From */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: '#72767d', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>From</div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 10px', borderRadius: '8px',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
          }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: g.colorFrom, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#dcddde', fontFamily: 'monospace' }}>{g.colorFrom}</span>
            <input type="color" value={g.colorFrom}
              onChange={e => update({ colorFrom: e.target.value })}
              style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
            />
          </label>
          <input type="color" value={g.colorFrom}
            onChange={e => update({ colorFrom: e.target.value })}
            style={{
              width: '100%', height: '6px', border: 'none',
              borderRadius: '3px', cursor: 'pointer', marginTop: '8px',
              background: 'transparent',
            }}
          />
        </div>

        {/* To */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: '#72767d', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>To</div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 10px', borderRadius: '8px',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
          }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: g.colorTo, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#dcddde', fontFamily: 'monospace' }}>{g.colorTo}</span>
            <input type="color" value={g.colorTo}
              onChange={e => update({ colorTo: e.target.value })}
              style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
            />
          </label>
          <input type="color" value={g.colorTo}
            onChange={e => update({ colorTo: e.target.value })}
            style={{
              width: '100%', height: '6px', border: 'none',
              borderRadius: '3px', cursor: 'pointer', marginTop: '8px',
              background: 'transparent',
            }}
          />
        </div>
      </div>

      <Divider />

      {/* ── Blob Count ── */}
      <Label right={`${g.blobCountMin} – ${g.blobCountMax} blobs`}>Blob Count</Label>
      <DualSlider
        min={1} max={20} step={1}
        valueMin={g.blobCountMin} valueMax={g.blobCountMax}
        onChangeMin={v => update({ blobCountMin: v })}
        onChangeMax={v => update({ blobCountMax: v })}
        accentHex={accentHex}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', marginBottom: '24px' }}>
        <span style={{ fontSize: '11px', color: '#4f545c' }}>Min: {g.blobCountMin}</span>
        <span style={{ fontSize: '11px', color: '#4f545c' }}>Max: {g.blobCountMax}</span>
      </div>

      {/* ── Blob Size ── */}
      <Label right={`${g.blobSizeMin}px – ${g.blobSizeMax}px`}>Blob Size Range</Label>
      <DualSlider
        min={10} max={800} step={10}
        valueMin={g.blobSizeMin} valueMax={g.blobSizeMax}
        onChangeMin={v => update({ blobSizeMin: v })}
        onChangeMax={v => update({ blobSizeMax: v })}
        accentHex={accentHex}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', marginBottom: '24px' }}>
        <span style={{ fontSize: '11px', color: '#4f545c' }}>Smallest: {g.blobSizeMin}px</span>
        <span style={{ fontSize: '11px', color: '#4f545c' }}>Largest: {g.blobSizeMax}px</span>
      </div>

      {/* ── Speed ── */}
      <Label right={
        g.speedMultiplier < 0.6 ? 'Fast' :
        g.speedMultiplier > 1.6 ? 'Slow' : 'Normal'
      }>
        Animation Speed
      </Label>
      <StyledSlider
        min={0.25} max={3} step={0.05}
        value={g.speedMultiplier}
        accentHex={accentHex}
        onChange={v => update({ speedMultiplier: v })}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: '#4f545c' }}>Fast (0.25×)</span>
        <span style={{ fontSize: '11px', color: '#4f545c' }}>Slow (3×)</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Props
 * ─────
 * isOpen          bool
 * onClose         fn
 * customization   object    Current state (see DEFAULT_CUSTOMIZATION)
 * onSave          fn(patch) Partial update — merge into your state
 *
 * Wiring to Background:
 *   <Background
 *     accentHex={customization.accentHex}
 *     backgroundOpacity={customization.backgroundOpacity}
 *     colorRange={{ from: customization.gradient.colorFrom, to: customization.gradient.colorTo }}
 *     minBlobs={customization.gradient.blobCountMin}
 *     maxBlobs={customization.gradient.blobCountMax}
 *     blobSizeRange={{ min: customization.gradient.blobSizeMin, max: customization.gradient.blobSizeMax }}
 *     blobSpeedMultiplier={customization.gradient.speedMultiplier}
 *     visible={settings.enableGradient}
 *   />
 */
export function CustomizationSlider({ isOpen, onClose, customization = DEFAULT_CUSTOMIZATION, onSave }) {
  const [activeSection, setActiveSection] = useState('gradient');

  useEffect(() => {
    if (!isOpen) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleChange = useCallback(patch => {
    onSave?.({ ...customization, ...patch });
  }, [customization, onSave]);

  if (!isOpen) return null;

  const accentHex = customization.accentHex || '#3b82f6';
  const groups = [...new Set(NAV.map(i => i.group))];
  const panelProps = { customization, onChange: handleChange, accentHex };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 110,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        animation: 'csFadeIn 0.15s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes csFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes csPanelIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .cs-nav-btn:hover { background: rgba(255,255,255,0.06) !important; color: #dcddde !important; }
      `}</style>

      <div style={{
        width: '90vw', maxWidth: '820px',
        height: '80vh', maxHeight: '640px',
        display: 'flex', borderRadius: '16px', overflow: 'hidden',
        background: '#2b2d31',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 80px ${accentHex}18`,
        animation: 'csPanelIn 0.2s ease',
      }}>

        {/* ── Left nav ── */}
        <div style={{
          width: '210px', flexShrink: 0,
          background: '#1e1f22',
          padding: '16px 8px',
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          overflowY: 'auto',
        }}>
          {/* Accent swatch at top */}
          <div style={{
            margin: '4px 8px 16px',
            height: '4px', borderRadius: '2px',
            background: `linear-gradient(to right, ${accentHex}, ${customization.gradient?.colorTo ?? accentHex})`,
            transition: 'background 0.2s',
          }} />

          {groups.map(group => (
            <div key={group} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, color: '#72767d',
                textTransform: 'uppercase', letterSpacing: '0.8px',
                padding: '4px 10px', marginBottom: '4px',
              }}>
                {group}
              </div>
              {NAV.filter(i => i.group === group).map(item => {
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    className="cs-nav-btn"
                    onClick={() => setActiveSection(item.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '6px', border: 'none',
                      background: active ? `${accentHex}22` : 'transparent',
                      color: active ? '#fff' : '#96989d',
                      cursor: 'pointer', fontSize: '14px', fontWeight: active ? 600 : 400,
                      textAlign: 'left', transition: 'all 0.1s',
                    }}
                  >
                    <item.icon size={15} color={active ? accentHex : '#72767d'} />
                    {item.label}
                    {active && (
                      <div style={{
                        marginLeft: 'auto', width: '3px', height: '16px',
                        borderRadius: '2px', background: accentHex,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          <div style={{ marginTop: 'auto', padding: '8px 10px', fontSize: '11px', color: '#4f545c' }}>
            Customizer v1.0
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', position: 'relative' }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#72767d', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#72767d'; }}
          >
            <X size={16} />
          </button>

          {activeSection === 'background' && <BackgroundPanel {...panelProps} />}
          {activeSection === 'gradient'   && <GradientPanel   {...panelProps} />}
        </div>
      </div>
    </div>
  );
}
