import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'light' | 'dark';
  className?: string;
}

export const OFFICIAL_LOGO_URL = 'https://i.postimg.cc/hGb7Tk9s/kominotelogo.png';

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'dark',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto',
  }[size];

  const textClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <img
        src={OFFICIAL_LOGO_URL}
        alt="Kominote Online Logo"
        referrerPolicy="no-referrer"
        className={`${sizeClasses} object-contain rounded-lg transition-transform duration-200 hover:scale-102`}
        loading="eager"
      />
      {showText && (
        <span
          className={`font-black tracking-tight ${textClasses} ${
            textColor === 'light' ? 'text-white' : 'text-slate-900'
          }`}
        >
          Kominote <span className="text-blue-600">Online</span>
        </span>
      )}
    </div>
  );
};
