import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }[size];

  return <Loader2 className={`animate-spin text-primary shrink-0 ${sizeClasses} ${className}`} />;
};

interface LineLoaderProps {
  className?: string;
}

export const LineLoader: React.FC<LineLoaderProps> = ({ className = '' }) => {
  return (
    <div className={`h-1 w-full bg-secondary overflow-hidden rounded-full ${className}`}>
      <div
        className="h-full bg-primary rounded-full animate-pulse w-1/3 animate-infinite animate-duration-1000 origin-left"
        style={{
          animation: 'loading-slide 1.5s infinite ease-in-out',
        }}
      />
      {/* Dynamic Keyframes injected globally for progress bar */}
      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%) scaleX(1); }
          50% { transform: translateX(0%) scaleX(1.5); }
          100% { transform: translateX(300%) scaleX(1); }
        }
      `}</style>
    </div>
  );
};

interface LoadingOverlayProps {
  fullscreen?: boolean;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  fullscreen = false,
  message,
  className = '',
}) => {
  const containerClasses = fullscreen
    ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm'
    : 'absolute inset-0 z-10 bg-background/65 backdrop-blur-[2px]';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${containerClasses} ${className}`}
    >
      <Spinner size="lg" />
      {message && (
        <p className="text-sm font-semibold font-sans text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};
