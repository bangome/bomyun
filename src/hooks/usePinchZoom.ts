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
  initialScrollLeft: number;
  initialScrollTop: number;
  centerX: number; // 컨테이너 내 중심점 X (스크롤 포함)
  centerY: number; // 컨테이너 내 중심점 Y (스크롤 포함)
}

export function usePinchZoom({
  currentScale,
  onZoomChange,
  minScale = MIN_SCALE,
  maxScale = MAX_SCALE,
}: UsePinchZoomOptions) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const pinchStateRef = useRef<PinchState | null>(null);
  const lastScaleRef = useRef<number>(currentScale);

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

  // 두 손가락의 중심점 계산 (화면 좌표)
  const getCenter = useCallback((touches: TouchList): { x: number; y: number } => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const [touch1, touch2] = [touches[0], touches[1]];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && container) {
        const rect = container.getBoundingClientRect();
        const center = getCenter(e.touches);

        // 컨테이너 기준 상대 좌표 + 스크롤 위치 = 문서 내 절대 좌표
        const centerX = center.x - rect.left + container.scrollLeft;
        const centerY = center.y - rect.top + container.scrollTop;

        pinchStateRef.current = {
          initialDistance: getDistance(e.touches),
          initialScale: currentScale,
          initialScrollLeft: container.scrollLeft,
          initialScrollTop: container.scrollTop,
          centerX,
          centerY,
        };
        lastScaleRef.current = currentScale;
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
        const scaleFactor = currentDistance / state.initialDistance;
        let newScale = state.initialScale * scaleFactor;

        // 범위 제한
        newScale = Math.max(minScale, Math.min(maxScale, newScale));
        newScale = Math.round(newScale * 100) / 100;

        // 스케일 변경
        onZoomChange(newScale);

        // 중심점 기준으로 스크롤 위치 조정
        // 새 스케일에서의 중심점 위치 = 원래 중심점 * (새 스케일 / 원래 스케일)
        const scaleRatio = newScale / state.initialScale;
        const newCenterX = state.centerX * scaleRatio;
        const newCenterY = state.centerY * scaleRatio;

        // 현재 화면에서의 중심점 위치 (컨테이너 기준)
        const center = getCenter(e.touches);
        const rect = container.getBoundingClientRect();
        const viewCenterX = center.x - rect.left;
        const viewCenterY = center.y - rect.top;

        // 새 스크롤 위치: 새 중심점 - 화면상 중심점 위치
        container.scrollLeft = newCenterX - viewCenterX;
        container.scrollTop = newCenterY - viewCenterY;

        lastScaleRef.current = newScale;
      }
    },
    [container, minScale, maxScale, onZoomChange, getDistance, getCenter]
  );

  const handleTouchEnd = useCallback(() => {
    pinchStateRef.current = null;
  }, []);

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
