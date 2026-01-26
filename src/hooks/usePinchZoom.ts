import { useRef, useEffect, useCallback, useState } from 'react';
import { MIN_SCALE, MAX_SCALE } from '../types/pdf.types';

interface UsePinchZoomOptions {
  currentScale: number;
  onZoomChange: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
}

export function usePinchZoom({
  currentScale,
  onZoomChange,
  minScale = MIN_SCALE,
  maxScale = MAX_SCALE,
}: UsePinchZoomOptions) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(currentScale);

  // callback ref를 반환
  const pinchZoomRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  const getDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const [touch1, touch2] = [touches[0], touches[1]];
    return Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistanceRef.current = getDistance(e.touches);
        initialScaleRef.current = currentScale;
      }
    },
    [currentScale, getDistance]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistanceRef.current !== null) {
        e.preventDefault();

        const currentDistance = getDistance(e.touches);
        const scaleFactor = currentDistance / initialDistanceRef.current;
        let newScale = initialScaleRef.current * scaleFactor;

        // 범위 제한
        newScale = Math.max(minScale, Math.min(maxScale, newScale));

        // 부드러운 스케일 변화를 위해 소수점 둘째자리까지 반올림
        newScale = Math.round(newScale * 100) / 100;

        onZoomChange(newScale);
      }
    },
    [minScale, maxScale, onZoomChange, getDistance]
  );

  const handleTouchEnd = useCallback(() => {
    initialDistanceRef.current = null;
  }, []);

  useEffect(() => {
    if (!container) return;

    // passive: false로 설정하여 preventDefault 호출 가능
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [container, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return pinchZoomRef;
}
