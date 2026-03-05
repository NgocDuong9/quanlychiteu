import { useState, useRef, useEffect } from 'react';
import { Trash2, Pencil } from 'lucide-react';

const ACTION_WIDTH = 140;
const SWIPE_THRESHOLD = 50;

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  children: React.ReactNode;
}

export function SwipeableTransactionItem({ isOpen, onOpen, onClose, onDelete, onEdit, children }: Props) {
  const [dragOffset, setDragOffset] = useState(isOpen ? -ACTION_WIDTH : 0);
  const [isDragging, setIsDragging] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const directionRef = useRef<'horizontal' | 'vertical' | null>(null);
  const currentOffsetRef = useRef(isOpen ? -ACTION_WIDTH : 0);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      const target = isOpen ? -ACTION_WIDTH : 0;
      currentOffsetRef.current = target;
      setDragOffset(target);
    }
  }, [isOpen]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      directionRef.current = null;
      isDraggingRef.current = true;
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.touches[0].clientX - startXRef.current;
      const dy = e.touches[0].clientY - startYRef.current;

      if (!directionRef.current) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          directionRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        }
        return;
      }

      if (directionRef.current === 'vertical') return;

      e.preventDefault();
      const base = isOpenRef.current ? -ACTION_WIDTH : 0;
      const newOffset = Math.min(0, Math.max(-ACTION_WIDTH, base + dx));
      currentOffsetRef.current = newOffset;
      setDragOffset(newOffset);
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      if (directionRef.current !== 'horizontal') return;

      const offset = currentOffsetRef.current;
      if (isOpenRef.current) {
        if (offset > -ACTION_WIDTH / 2) {
          onCloseRef.current();
        } else {
          currentOffsetRef.current = -ACTION_WIDTH;
          setDragOffset(-ACTION_WIDTH);
        }
      } else {
        if (offset < -SWIPE_THRESHOLD) {
          onOpenRef.current();
        } else {
          onCloseRef.current();
        }
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden">
      <div
        ref={rowRef}
        style={{
          display: 'flex',
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}
      >
        <div style={{ minWidth: '100%' }}>
          {children}
        </div>

        <button
          onClick={onEdit}
          style={{ width: ACTION_WIDTH / 2, flexShrink: 0 }}
          className="flex flex-col items-center justify-center gap-1 bg-[#0a84ff] active:opacity-80 transition-opacity relative"
        >
          <Pencil size={16} className="text-white" />
          <span className="text-[10px] font-bold text-white">Sửa</span>
        </button>
        <button
          onClick={onDelete}
          style={{ width: ACTION_WIDTH / 2, flexShrink: 0 }}
          className="flex flex-col items-center justify-center gap-1 bg-[#ff453a] active:opacity-80 transition-opacity"
        >
          <Trash2 size={16} className="text-white" />
          <span className="text-[10px] font-bold text-white">Xóa</span>
        </button>
      </div>
    </div>
  );
}
