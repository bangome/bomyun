import { useRef, useEffect, useCallback, useState } from 'react';
import { MIN_SCALE, MAX_SCALE } from '../types/pdf.types';

interface UsePinchZoomOptions {
  currentScale: number;
  onZoomChange: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
}

interface PinchState {
  initialDistance: number;
  initialScale: number;
  centerX: number;
  centerY: number;
  viewCenterX: number;
  viewCenterY: number;
}

export function usePinchZoom({
  currentScale,
  onZoomChange,
  minScale = MIN_SCALE,
  maxScale = MAX_SCALE,
}: UsePinchZoomOptions) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const pinchStateRef = useRef<PinchState | null>(null);
  const visualScaleRef = useRef<number>(1); // CSS transform용 시각적 스케일 비율

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

  const getCenter = useCallback((touches: TouchList): { x: number; y: number } => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const [touch1, touch2] = [touches[0], touches[1]];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  // CSS transform 적용 (시각적 줌)
  const applyVisualZoom = useCallback((scaleRatio: number, originX: number, originY: number) => {
    if (!container) return;
    const content = container.firstElementChild as HTMLElement;
    if (!content) return;

    content.style.transformOrigin = `${originX}px ${originY}px`;
    content.style.transform = `scale(${scaleRatio})`;
  }, [container]);

  // CSS transform 초기화
  const resetVisualZoom = useCallback(() => {
    if (!container) return;
    const content = container.firstElementChild as HTMLElement;
    if (!content) return;

    content.style.transform = '';
    content.style.transformOrigin = '';
  }, [container]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && container) {
        const rect = container.getBoundingClientRect();
        const center = getCenter(e.touches);

        const viewCenterX = center.x - rect.left;
        const viewCenterY = center.y - rect.top;
        const centerX = viewCenterX + container.scrollLeft;
        const centerY = viewCenterY + container.scrollTop;

        pinchStateRef.current = {
          initialDistance: getDistance(e.touches),
          initialScale: currentScale,
          centerX,
          centerY,
          viewCenterX,
          viewCenterY,
        };
        visualScaleRef.current = 1;
      }
    },
    [container, currentScale, getDistance, getCenter]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStateRef.current && container) {
        e.preventDefault();

        const state = pinchStateRef.current;
        const currentDistance = getDistance(e.touches);
        const scaleRatio = currentDistance / state.initialDistance;

        // 새 스케일 계산 (범위 제한)
        let newScale = state.initialScale * scaleRatio;
        newScale = Math.max(minScale, Math.min(maxScale, newScale));

        // 실제 적용할 비율 (범위 제한 반영)
        const actualRatio = newScale / state.initialScale;
        visualScaleRef.current = actualRatio;

        // CSS transform으로 시각적 줌만 적용 (깜빡임 없음)
        applyVisualZoom(actualRatio, state.centerX, state.centerY);
      }
    },
    [container, minScale, maxScale, getDistance, applyVisualZoom]
  );

  const handleTouchEnd = useCallback(() => {
    if (pinchStateRef.current && container) {
      const state = pinchStateRef.current;
      const finalScale = state.initialScale * visualScaleRef.current;
      const roundedScale = Math.round(finalScale * 100) / 100;

      // CSS transform 초기화
      resetVisualZoom();

      // 실제 스케일 적용 (렌더링 발생)
      onZoomChange(roundedScale);

      // 스크롤 위치 조정
      requestAnimationFrame(() => {
        if (!container) return;
        const scaleRatio = roundedScale / state.initialScale;
        const newCenterX = state.centerX * scaleRatio;
        const newCenterY = state.centerY * scaleRatio;

        container.scrollLeft = newCenterX - state.viewCenterX;
        container.scrollTop = newCenterY - state.viewCenterY;
      });
    }
    pinchStateRef.current = null;
    visualScaleRef.current = 1;
  }, [container, onZoomChange, resetVisualZoom]);

  useEffect(() => {
    if (!container) return;

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
