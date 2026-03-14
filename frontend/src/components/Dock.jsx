import React, { useState } from 'react';

function Dock({ items = [], baseItemSize = 44, magnification = 62 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const getSize = (index) => {
    if (hoveredIndex === null) return baseItemSize;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return magnification;
    if (distance === 1) return baseItemSize + (magnification - baseItemSize) * 0.5;
    if (distance === 2) return baseItemSize + (magnification - baseItemSize) * 0.2;
    return baseItemSize;
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '6px',
      padding: '10px 8px',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '20px', width: '100%',
    }}>
      {items.map((item, i) => {
        const size = getSize(i);
        return (
          <div
            key={i}
            onClick={item.onClick}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              width: `${size}px`, height: `${size}px`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
              background: item.active
                ? 'rgba(37,99,235,0.45)'
                : hoveredIndex === i ? 'rgba(37,99,235,0.35)' : 'rgba(255,255,255,0.07)',
              border: item.active
                ? '1px solid rgba(37,99,235,0.6)'
                : '1px solid rgba(255,255,255,0.07)',
              color: item.active || hoveredIndex === i ? 'white' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              position: 'relative',
              fontSize: `${Math.round(size * 0.4)}px`,
              boxShadow: item.active ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
            }}
            title={item.label}
          >
            {item.icon}

            {/* Tooltip */}
            <div style={{
              position: 'absolute',
              left: 'calc(100% + 12px)',
              top: '50%', transform: 'translateY(-50%)',
              background: '#0f172a', color: 'white',
              fontSize: '12px', fontWeight: 700,
              padding: '5px 10px', borderRadius: '8px',
              whiteSpace: 'nowrap', pointerEvents: 'none',
              opacity: hoveredIndex === i ? 1 : 0,
              transition: 'opacity 0.15s',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              zIndex: 999, fontFamily: "'Nunito', sans-serif",
            }}>
              {/* Arrow */}
              <div style={{
                position: 'absolute', right: '100%', top: '50%',
                transform: 'translateY(-50%)',
                width: 0, height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '6px solid #0f172a',
              }} />
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Dock;