import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ─── Color math ───────────────────────────────────────────────────────────────

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  const k = (n) => (n + h / 60) % 6;
  const f = (n) => v - v * s * Math.max(0, Math.min(k(n), 4 - k(n), 1));
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if      (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else                h = (r - g) / d + 4;
    h *= 60;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  return [Math.round(h), Math.round(s), Math.round(v)];
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex?.trim() ?? '');
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToHsv(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsv(...rgb) : [0, 100, 100];
}

// ─── SB Canvas ────────────────────────────────────────────────────────────────

function SBCanvas({ hue, saturation, brightness, onChange, size = 240 }) {
  const canvasRef = useRef(null);
  const dragging  = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width: w, height: h } = canvas;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, w, h);
    const white = ctx.createLinearGradient(0, 0, w, 0);
    white.addColorStop(0, 'rgba(255,255,255,1)');
    white.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = white;
    ctx.fillRect(0, 0, w, h);
    const black = ctx.createLinearGradient(0, 0, 0, h);
    black.addColorStop(0, 'rgba(0,0,0,0)');
    black.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, w, h);
  }, [hue]);

  const pickAt = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top,  rect.height));
    onChange(Math.round((x / rect.width) * 100), Math.round((1 - y / rect.height) * 100));
  }, [onChange]);

  const onPointerDown = (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); pickAt(e); };
  const onPointerMove = (e) => { if (dragging.current) pickAt(e); };
  const onPointerUp   = ()  => { dragging.current = false; };

  return (
    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', cursor: 'crosshair', flexShrink: 0 }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={Math.round(size * 0.67)}
        style={{ display: 'block', width: '100%', height: `${Math.round(size * 0.67)}px` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <div style={{
        position: 'absolute',
        left: `${saturation}%`, top: `${100 - brightness}%`,
        width: '14px', height: '14px', borderRadius: '50%',
        border: '2px solid #fff',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,0,0,0.2)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── Hue Slider ───────────────────────────────────────────────────────────────

function HueSlider({ hue, onChange }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const pickAt = useCallback((e) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    onChange(Math.round((x / rect.width) * 360));
  }, [onChange]);

  const onPointerDown = (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); pickAt(e); };
  const onPointerMove = (e) => { if (dragging.current) pickAt(e); };
  const onPointerUp   = ()  => { dragging.current = false; };

  return (
    <div style={{ position: 'relative', height: '14px', cursor: 'ew-resize' }}>
      <div
        ref={trackRef}
        style={{
          position: 'absolute', inset: 0, borderRadius: '7px',
          background: 'linear-gradient(to right, #f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <div style={{
        position: 'absolute',
        left: `${(hue / 360) * 100}%`, top: '50%',
        width: '16px', height: '16px', borderRadius: '50%',
        background: `hsl(${hue},100%,50%)`,
        border: '2px solid #fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── Shared picker body ───────────────────────────────────────────────────────

function PickerBody({ value, onChange, canvasSize }) {
  const [hexInput, setHexInput] = useState(value);
  const [h, s, v] = hexToHsv(value);

  useEffect(() => { setHexInput(value); }, [value]);

  const emitHsv = (nh, ns, nv) => onChange?.(rgbToHex(...hsvToRgb(nh, ns, nv)));

  const handleHexInput = (raw) => {
    setHexInput(raw);
    const clean = raw.startsWith('#') ? raw : '#' + raw;
    if (/^#[0-9a-f]{6}$/i.test(clean)) onChange?.(clean);
  };

  const previewHex = rgbToHex(...hsvToRgb(h, s, v));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SBCanvas
        hue={h} saturation={s} brightness={v}
        onChange={(ns, nv) => emitHsv(h, ns, nv)}
        size={canvasSize}
      />
      <HueSlider hue={h} onChange={(nh) => emitHsv(nh, s, v)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '6px',
          background: previewHex, flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.1)',
        }} />
        <input
          value={hexInput}
          onChange={(e) => handleHexInput(e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px', color: '#fff',
            fontSize: '13px', fontFamily: 'monospace',
            padding: '6px 10px', outline: 'none', letterSpacing: '0.5px',
          }}
          onFocus={e => e.target.style.borderColor = value}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>
    </div>
  );
}

// ─── ColorPicker ──────────────────────────────────────────────────────────────
/**
 * Props
 * ─────
 * value       string    Hex color. Default '#3b82f6'.
 * onChange    fn        Called with new hex string on every interaction.
 * label       string    Optional label shown above.
 * inline      bool      Render picker body directly — no swatch, no popover.
 * canvasSize  number    Width of the SB canvas in px. Default 240.
 */
export function ColorPicker({ value = '#3b82f6', onChange, label, inline = false, canvasSize = 240 }) {
  const [open, setOpen]       = useState(false);
  const swatchRef             = useRef(null);
  const popoverRef            = useRef(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, flipUp: false });

  // Calculate popover position from swatch's screen coordinates
  const updatePos = useCallback(() => {
    if (!swatchRef.current) return;
    const rect        = swatchRef.current.getBoundingClientRect();
    const popW        = canvasSize + 28; // padding on both sides
    const spaceBelow  = window.innerHeight - rect.bottom;
    const flipUp      = spaceBelow < 320;
    const left        = Math.min(
      Math.max(rect.left + rect.width / 2 - popW / 2, 8),
      window.innerWidth - popW - 8
    );
    setPopoverPos({
      top:    flipUp ? rect.top - 8  : rect.bottom + 8,
      left,
      flipUp,
    });
  }, [canvasSize]);

  const handleSwatchClick = () => {
    if (!open) updatePos();
    setOpen(v => !v);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        swatchRef.current  && !swatchRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  // ── Inline mode ─────────────────────────────────────────────────────────────
  if (inline) {
    return (
      <div>
        {label && <LabelText>{label}</LabelText>}
        <PickerBody value={value} onChange={onChange} canvasSize={canvasSize} />
      </div>
    );
  }

  // ── Popover mode ─────────────────────────────────────────────────────────────
  const popoverContent = open ? createPortal(
    <div
      ref={popoverRef}
      style={{
        position:     'fixed',
        top:          popoverPos.flipUp ? 'auto' : popoverPos.top,
        bottom:       popoverPos.flipUp ? window.innerHeight - popoverPos.top : 'auto',
        left:         popoverPos.left,
        zIndex:       9999,
        width:        `${canvasSize + 28}px`,
        padding:      '14px',
        borderRadius: '12px',
        background:   '#111214',
        border:       '1px solid rgba(255,255,255,0.1)',
        boxShadow:    '0 16px 48px rgba(0,0,0,0.8)',
        animation:    'cpFadeIn 0.12s ease',
      }}
    >
      <style>{`@keyframes cpFadeIn { from { opacity:0; transform:translateY(${popoverPos.flipUp ? '4px' : '-4px'}); } to { opacity:1; transform:translateY(0); } }`}</style>
      <PickerBody value={value} onChange={onChange} canvasSize={canvasSize} />
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {label && <LabelText>{label}</LabelText>}
      <button
        ref={swatchRef}
        onClick={handleSwatchClick}
        title={value}
        style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: value, border: 'none', cursor: 'pointer',
          outline:      open ? '3px solid #fff' : '3px solid rgba(255,255,255,0.2)',
          outlineOffset:'2px',
          transition:   'outline 0.15s, transform 0.15s',
          transform:    open ? 'scale(1.15)' : 'scale(1)',
          flexShrink:   0, display: 'block',
        }}
      />
      {popoverContent}
    </div>
  );
}

// ─── Tiny helper ─────────────────────────────────────────────────────────────

function LabelText({ children }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 700, color: '#b9bbbe',
      textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px',
    }}>
      {children}
    </div>
  );
}
