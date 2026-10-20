import React from 'react';

interface FolderProps {
  color?: string;
  size?: number;
  items?: React.ReactNode[];
  className?: string;
  label?: string;
  subLabel?: string;
}

const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map(c => c + c)
      .join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const Folder: React.FC<FolderProps> = ({ color = '#5227FF', size = 1, items = [], className = '', label, subLabel }) => {
  const maxItems = 3;
  const papers = items.slice(0, maxItems);
  while (papers.length < maxItems) {
    papers.push(null);
  }

  const folderBackColor = darkenColor(color, 0.08);
  const paper1 = darkenColor('#ffffff', 0.1);
  const paper2 = darkenColor('#ffffff', 0.05);
  const paper3 = '#ffffff';

  const folderStyle: React.CSSProperties = {
    '--folder-color': color,
    '--folder-back-color': folderBackColor,
    '--paper-1': paper1,
    '--paper-2': paper2,
    '--paper-3': paper3
  } as React.CSSProperties;

  const scaleStyle = { transform: `scale(${size})` };

  return (
    <div style={scaleStyle} className={className}>
      <div
        className="group relative transition-all duration-200 ease-in"
        style={folderStyle}
      >
        <div
          className="relative w-[100px] h-[80px] rounded-tl-0 rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]"
          style={{ backgroundColor: folderBackColor }}
        >
          {/* Folder Back Tab */}
          <span
            className="absolute z-0 bottom-[98%] left-0 w-[30px] h-[10px] rounded-tl-[5px] rounded-tr-[5px] rounded-bl-0 rounded-br-0"
            style={{ backgroundColor: folderBackColor }}
          ></span>
          
          {/* Papers */}
          {papers.map((item, i) => {
            let sizeClasses = '';
            if (i === 0) sizeClasses = 'w-[70%] h-[80%]';
            if (i === 1) sizeClasses = 'w-[80%] h-[70%]';
            if (i === 2) sizeClasses = 'w-[90%] h-[60%]';

            return (
              <div
                key={i}
                className={`absolute z-20 bottom-[10%] left-1/2 transition-all duration-300 ease-in-out transform -translate-x-1/2 translate-y-[10%] group-hover:translate-y-0 ${sizeClasses}`}
                style={{
                  backgroundColor: i === 0 ? paper1 : i === 1 ? paper2 : paper3,
                  borderRadius: '10px'
                }}
              >
                {item}
              </div>
            );
          })}
          
          {/* Front Cover Skew Right Effect */}
          <div
            className="absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out group-hover:[transform:skew(15deg)_scaleY(0.6)]"
            style={{
              backgroundColor: color,
              borderRadius: '5px 10px 10px 10px',
            }}
          ></div>
          
          {/* Front Cover Skew Left Effect & Label */}
          <div
            className="absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out flex flex-col items-center justify-center pt-1 group-hover:[transform:skew(-15deg)_scaleY(0.6)]"
            style={{
              backgroundColor: color,
              borderRadius: '5px 10px 10px 10px',
            }}
          >
            {(label || subLabel) && (
              <div className="relative flex flex-col items-center justify-center px-1.5 py-1 bg-[#fdfbf7] shadow-[0_2px_8px_rgba(0,0,0,0.15)] rounded-[4px] pointer-events-none w-[92%] mt-1 transition-opacity duration-300 group-hover:opacity-60">
                {label && <span className="text-[8.5px] font-black text-black/80 uppercase tracking-widest leading-tight w-full text-center block break-words whitespace-normal">{label}</span>}
                {subLabel && <span className="text-[5px] font-bold text-black/40 uppercase tracking-wider mt-0.5 leading-none block">{subLabel}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Folder;
