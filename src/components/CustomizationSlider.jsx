import { useState, useEffect, useCallback } from 'react';
import { X, Sliders, Sparkles } from 'lucide-react';
import { ColorPicker } from './ColorPicker';

// ─── Default state ────────────────────────────────────────────────────────────

export const DEFAULT_CUSTOMIZATION = {
  accentHex:         '#5a00d9',
  backgroundOpacity: 1.0,
  gradient: {
    colorFrom:          '#5a00d9',
    colorTo:            '#6300d4',
    blobCountMin:       7,
    blobCountMax:       9,
    blobSizeMin:        20,
    blobSizeMax:        450,
    speedMultiplier:    1.0,
  },
};

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'background', label: 'Background',          icon: Sliders,  group: 'Colors'  },
  { id: 'gradient',   label: 'Gradient Customizer', icon: Sparkles, group: 'Effects' },
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

function StyledSlider({ min, max, step = 1, value, onChange, trackGradient, accentHex }) {
  const pct = ((value - min) / (max - min)) * 100;
  const gradient = trackGradient
    ?? `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`;

  return (
    <>
      <style>{`
        .cslider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff; box-shadow: 0 0 0 3px rgba(0,0,0,0.4);
          cursor: pointer; transition: transform 0.1s;
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

// Dual-thumb slider (min/max)
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
  return (
    <div>
      <SectionTitle>Accent Color</SectionTitle>
      <SectionSubtitle>Pick your accent colour — adjust hue, saturation, and brightness.</SectionSubtitle>

      <ColorPicker
        inline
        canvasSize={320}
        value={customization.accentHex ?? accentHex}
        onChange={hex => onChange({ accentHex: hex })}
      />
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
        height: '40px', borderRadius: '8px', marginBottom: '20px',
        background: gradientPreview,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `0 0 20px ${g.colorFrom}33, 0 0 20px ${g.colorTo}33`,
        transition: 'background 0.15s',
      }} />

      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#72767d', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>From</div>
          <ColorPicker
            value={g.colorFrom}
            onChange={v => update({ colorFrom: v })}
          />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#72767d', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>To</div>
          <ColorPicker
            value={g.colorTo}
            onChange={v => update({ colorTo: v })}
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
