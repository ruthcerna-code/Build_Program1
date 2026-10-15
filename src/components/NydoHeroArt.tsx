import React from 'react';

export const NydoHeroArt: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 680 410"
    role="img"
    aria-label="Ilustración de una ventana con malla, un gato y plantas"
  >
    <defs>
      <pattern id="nydo-mesh" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M24 0H0V24" fill="none" stroke="#090909" strokeWidth="1.2" opacity=".5" />
      </pattern>
    </defs>
    <path d="M54 355Q15 140 143 70T487 70Q654 194 590 353Z" fill="#f2e7dd" />
    <g transform="rotate(-5 300 210)">
      <path d="M136 348V64Q285 13 439 64V348Z" fill="#7ec1ff" stroke="#090909" strokeWidth="8" />
      <path d="M136 348V64Q285 13 439 64V348Z" fill="url(#nydo-mesh)" />
      <path d="M286 39V348M136 188H439" stroke="#090909" strokeWidth="9" />
      <path d="M117 353H461" stroke="#090909" strokeWidth="18" strokeLinecap="round" />
      <circle cx="269" cy="219" r="5" fill="#090909" />
    </g>
    <path
      d="M371 371Q362 310 402 288L395 240L424 265L458 260L478 231L490 289Q520 325 494 371"
      fill="#fb63be"
      stroke="#090909"
      strokeWidth="5"
    />
    <path d="M494 360Q563 365 539 310" fill="none" stroke="#090909" strokeWidth="14" strokeLinecap="round" />
    <path
      d="M420 293l8 3m37-5-8 4m-22 18q10 12 20-1"
      fill="none"
      stroke="#090909"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path d="M65 370L55 312H119L109 370Z" fill="#edbe49" stroke="#090909" strokeWidth="4" />
    <path
      d="M86 313V221M85 275Q32 277 38 242Q80 234 85 275M87 256Q135 246 130 217Q83 218 87 256"
      fill="#7ec1ff"
      stroke="#090909"
      strokeWidth="4"
    />
    <path d="M539 85l10-31 12 26 32-8-19 27 18 24-32-5-16 30-4-34-29-6Z" fill="#edbe49" />
    <path d="M41 123l-11-21m27 14 4-24m-31 49-25-5" stroke="#090909" strokeWidth="4" strokeLinecap="round" />
    <path d="M50 379Q303 390 563 377" stroke="#090909" strokeWidth="4" fill="none" />
  </svg>
);
