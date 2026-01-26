import { useCallback, useRef, useEffect, useState } from 'react';

interface UseMousePanOptions {
  enabled?: boolean;
}

export function useMousePan({ enabled = true }: UseMousePanOptions = {}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const isPanningRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const scrollPosRef = useRef({ x: 0, y: 0 });

  const panRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // 왼쪽 마우스 버튼만 처리
    if (e.button !== 0) return;

    // 입력 요소에서는 패닝 비활성화
    if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLSelectElement) {
      return;
    }

    if (!container) return;

    isPanningRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    scrollPosRef.current = { x: container.scrollLeft, y: container.scrollTop };

    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
  }, [container]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanningRef.current || !container) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;

    container.scrollLeft = scrollPosRef.current.x - dx;
    container.scrollTop = scrollPosRef.current.y - dy;
  }, [container]);

  const handleMouseUp = useCallback(() => {
    if (!container) return;

    isPanningRef.current = false;
    container.style.cursor = 'grab';
    container.style.userSelect = '';
  }, [container]);

  const handleMouseLeave = useCallback(() => {
    if (!container) return;

    isPanningRef.current = false;
    container.style.cursor = 'grab';
    container.style.userSelect = '';
  }, [container]);

  useEffect(() => {
    if (!container || !enabled) return;

    // 초기 커서 설정
    container.style.cursor = 'grab';

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.style.cursor = '';
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [container, enabled, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave]);

  return panRef;
}
