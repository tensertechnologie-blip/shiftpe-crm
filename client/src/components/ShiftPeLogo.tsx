import React, { useState } from 'react';

interface ShiftPeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitleText?: string;
  onClick?: () => void;
  variant?: 'lockup' | 'icon-only';
}

export const ShiftPeLogo: React.FC<ShiftPeLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  subtitleText = 'Find work. Near you.',
  onClick,
  variant = 'lockup'
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const dimensions = {
    sm: { circle: 28, fontSize: 18, sSize: 15, subtitleSize: 10, gap: 9 },
    md: { circle: 36, fontSize: 22, sSize: 18, subtitleSize: 11, gap: 11 },
    lg: { circle: 48, fontSize: 30, sSize: 24, subtitleSize: 12.5, gap: 14 },
    xl: { circle: 64, fontSize: 40, sSize: 32, subtitleSize: 14, gap: 16 }
  }[size];

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: showSubtitle ? 'flex-start' : 'center',
        gap: `${dimensions.gap}px`,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      {/* ShiftPe Authentic Circular Icon */}
      {!imgFailed ? (
        <img
          src="/shiftpe-icon.png"
          alt="ShiftPe Logo"
          onError={() => setImgFailed(true)}
          style={{
            width: `${dimensions.circle}px`,
            height: `${dimensions.circle}px`,
            borderRadius: '50%',
            objectFit: 'contain',
            flexShrink: 0,
            boxShadow: '0 2px 10px var(--shiftpe-coral-glow)',
            marginTop: showSubtitle ? '2px' : 0,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      ) : (
        <div
          style={{
            width: `${dimensions.circle}px`,
            height: `${dimensions.circle}px`,
            borderRadius: '50%',
            backgroundColor: 'var(--shiftpe-coral)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 10px var(--shiftpe-coral-glow)',
            marginTop: showSubtitle ? '2px' : 0
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontWeight: 900,
              fontSize: `${dimensions.sSize}px`,
              fontFamily: 'var(--font-sans)',
              lineHeight: 1
            }}
          >
            S
          </span>
        </div>
      )}

      {/* ShiftPe Wordmark & Tagline */}
      {variant === 'lockup' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: `${dimensions.fontSize}px`,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              display: 'flex',
              alignItems: 'baseline'
            }}
          >
            <span style={{ color: 'var(--text)', transition: 'color 0.2s ease' }}>Shift</span>
            <span style={{ color: 'var(--shiftpe-coral)' }}>Pe</span>
          </div>

          {showSubtitle && (
            <span
              style={{
                fontSize: `${dimensions.subtitleSize}px`,
                color: 'var(--muted)',
                fontWeight: 500,
                letterSpacing: '0.2px',
                marginTop: '3px'
              }}
            >
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
