import { useEffect, useRef } from 'react';

type ContextMenuProps = {
  x: number;
  y: number;
  options: { label: string; onClick: () => void; icon?: string; color?: string }[];
  onClose: () => void;
};

export function ContextMenu({ x, y, options, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] min-w-[160px] overflow-hidden rounded-xl border border-brass/20 bg-[#121010]/95 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
      style={{ top: y, left: x }}
    >
      <div className="py-1">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => {
              option.onClick();
              onClose();
            }}
            className={`flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-medium transition-colors hover:bg-brass/10 ${
              option.color || 'text-stone/80 hover:text-amber-200'
            }`}
          >
            {option.icon && <span className="text-sm">{option.icon}</span>}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
