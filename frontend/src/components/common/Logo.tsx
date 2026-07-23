import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', showText = false }) => {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div className={`relative flex items-center justify-center ${dimensions} shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2B2" />
              <stop offset="25%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFA500" />
              <stop offset="75%" stopColor="#FF8C00" />
              <stop offset="100%" stopColor="#FFE57F" />
            </linearGradient>
            <linearGradient id="goldGradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background rounded rect */}
          <rect x="2" y="2" width="96" height="96" rx="22" fill="#0D1117" />
          <rect x="2" y="2" width="96" height="96" rx="22" stroke="url(#goldGradient)" strokeWidth="2.5" strokeOpacity="0.4" />

          {/* Golden Crown */}
          <g filter="url(#glow)">
            {/* Crown Base Band */}
            <path
              d="M 28 36 Q 50 40 72 36 L 70 32 Q 50 36 30 32 Z"
              fill="url(#goldGradient)"
            />

            {/* Crown Spikes */}
            <path
              d="M 28 34 
                 L 22 18 L 36 28 
                 L 50 12 L 64 28 
                 L 78 18 L 72 34 
                 Q 50 38 28 34 Z"
              fill="url(#goldGradient)"
            />

            {/* Stars on Top of Crown Peaks */}
            {/* Peak 1 */}
            <polygon points="22,12 23.5,15.5 27,15.5 24,17.5 25,21 22,19 19,21 20,17.5 17,15.5 20.5,15.5" fill="url(#goldGradient)" />
            {/* Peak 2 */}
            <polygon points="36,22 37.5,24.5 40,24.5 38,26 38.8,29 36,27.5 33.2,29 34,26 32,24.5 34.5,24.5" fill="url(#goldGradient)" />
            {/* Peak 3 (Center Top) */}
            <polygon points="50,5 51.8,9.5 56.5,9.5 52.8,12 54.2,16.5 50,13.8 45.8,16.5 47.2,12 43.5,9.5 48.2,9.5" fill="url(#goldGradient)" />
            {/* Peak 4 */}
            <polygon points="64,22 65.5,24.5 68,24.5 66,26 66.8,29 64,27.5 61.2,29 62,26 60,24.5 62.5,24.5" fill="url(#goldGradient)" />
            {/* Peak 5 */}
            <polygon points="78,12 79.5,15.5 83,15.5 80,17.5 81,21 78,19 75,21 76,17.5 73,15.5 76.5,15.5" fill="url(#goldGradient)" />
          </g>

          {/* Letter 'Z' */}
          <g filter="url(#glow)">
            {/* Main Z Body */}
            <path
              d="M 25 44 
                 H 75 
                 V 54 
                 L 40 80 
                 H 75 
                 V 90 
                 H 25 
                 V 80 
                 L 60 54 
                 H 25 
                 Z"
              fill="url(#goldGradient)"
            />
            {/* Highlight overlay for metallic bevel */}
            <path
              d="M 25 44 H 75 V 48 H 29 L 62 74 H 25 Z"
              fill="url(#goldGradientLight)"
            />
          </g>
        </svg>
      </div>

      {showText && (
        <span className="font-sans font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
          Zx-Escola
        </span>
      )}
    </div>
  );
};
