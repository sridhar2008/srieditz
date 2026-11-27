import React from 'react';
import { STUDIO_LOGO_PATH } from '../../data/defaultCatalog';

interface StudioLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const StudioLogo: React.FC<StudioLogoProps> = ({
  size = 'md',
  showWordmark = true,
}) => {
  const frameClasses =
    size === 'sm'
      ? 'w-9 h-9 p-0.5 rounded-lg'
      : size === 'lg'
        ? 'w-20 h-20 p-1.5 rounded-2xl'
        : 'w-10 h-10 p-1 rounded-xl';

  const wordmarkClasses =
    size === 'lg' ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg';

  return (
    <span className="inline-flex items-center gap-3 shrink-0">
      <span
        className={`${frameClasses} bg-white border border-[#D4AF37]/50 shadow-sm flex items-center justify-center overflow-hidden shrink-0`}
      >
        <img
          src={STUDIO_LOGO_PATH}
          alt="SRI EDITING STUDIO Official Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
        />
      </span>
      {showWordmark && (
        <span
          className={`${wordmarkClasses} font-display font-semibold tracking-wide text-white whitespace-nowrap`}
        >
          SRI EDITING STUDIO
        </span>
      )}
    </span>
  );
};
