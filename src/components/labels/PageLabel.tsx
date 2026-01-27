import { useState, useRef, useCallback, useEffect } from 'react';
import type { Label } from '../../types/database.types';

interface PageLabelProps {
  label: Label;
  onClick?: (label: Label) => void;
  onDragEnd?: (label: Label, newX: number, newY: number) => void;
}

export function PageLabel({ label, onClick, onDragEnd }: PageLabelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState({ x: label.position_x, y: label.position_y });
  const labelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  // 색상에서 60% 투명도 적용
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const bgColor = hexToRgba(label.color, 0.6);
  const borderColor = label.color;

  // label prop이 변경되면 position 업데이트
  useEffect(() => {
    if (!isDragging) {
      setCurrentPosition({ x: label.position_x, y: label.position_y });
    }
  }, [label.position_x, label.position_y, isDragging]);

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const labelEl = labelRef.current;
    if (!labelEl) return;

    const labelRect = labelEl.getBoundingClientRect();

    // 마우스 위치와 라벨 위치의 오프셋 계산
    setDragOffset({
      x: e.clientX - labelRect.left,
      y: e.clientY - labelRect.top,
    });

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    setIsDragging(true);
  }, []);

  // 드래그 중
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const labelEl = labelRef.current;
      if (!labelEl) return;

      const parentEl = labelEl.parentElement;
      if (!parentEl) return;

      // 이동 거리 확인 (5px 이상 이동해야 드래그로 인식)
      if (dragStartRef.current) {
        const dx = Math.abs(e.clientX - dragStartRef.current.x);
        const dy = Math.abs(e.clientY - dragStartRef.current.y);
        if (dx > 5 || dy > 5) {
          hasDraggedRef.current = true;
        }
      }

      const parentRect = parentEl.getBoundingClientRect();

      // 새 위치 계산 (퍼센트)
      const newX = ((e.clientX - dragOffset.x - parentRect.left) / parentRect.width) * 100;
      const newY = ((e.clientY - dragOffset.y + 12 - parentRect.top) / parentRect.height) * 100; // +12는 라벨 높이의 절반 (translateY(-50%) 보정)

      // 경계 제한 (0-100%)
      setCurrentPosition({
        x: Math.max(0, Math.min(100, newX)),
        y: Math.max(0, Math.min(100, newY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // 드래그가 실제로 발생했으면 위치 업데이트
      if (hasDraggedRef.current && onDragEnd) {
        onDragEnd(label, currentPosition.x, currentPosition.y);
      }

      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, label, currentPosition, onDragEnd]);

  // 클릭 핸들러 (드래그가 아닐 때만)
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // 드래그 후에는 클릭 이벤트 무시
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    onClick?.(label);
  }, [label, onClick]);

  return (
    <div
      ref={labelRef}
      className={`absolute flex items-center z-20 select-none ${
        isDragging ? 'cursor-grabbing opacity-80' : 'cursor-grab hover:scale-105'
      } transition-transform`}
      style={{
        left: `${currentPosition.x}%`,
        top: `${currentPosition.y}%`,
        transform: 'translateY(-50%)',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* 왼쪽 뾰족한 부분 */}
      <div
        className="w-0 h-0 flex-shrink-0"
        style={{
          borderTop: '12px solid transparent',
          borderBottom: '12px solid transparent',
          borderRight: `10px solid ${bgColor}`,
        }}
      />
      {/* 직사각형 텍스트 영역 */}
      <div
        className="px-2 py-1 text-white text-xs font-medium whitespace-nowrap max-w-48 truncate"
        style={{
          backgroundColor: bgColor,
          borderTop: `1px solid ${borderColor}`,
          borderRight: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
        }}
        title={label.text}
      >
        {label.text}
      </div>
    </div>
  );
}
