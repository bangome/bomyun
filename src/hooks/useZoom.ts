import { useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { MIN_SCALE, MAX_SCALE, SCALE_STEP } from '../types/pdf.types';

export function useZoom() {
  const { scale, setScale, zoomIn, zoomOut } = useStore();

  const fitToWidth = useCallback(
    (containerWidth: number, pageWidth: number) => {
      if (pageWidth <= 0 || containerWidth <= 0) return;
      const newScale = containerWidth / pageWidth;
      setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
    },
    [setScale]
  );

  const fitToPage = useCallback(
    (
      containerWidth: number,
      containerHeight: number,
      pageWidth: number,
      pageHeight: number
    ) => {
      if (pageWidth <= 0 || pageHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) return;
      const scaleX = containerWidth / pageWidth;
      const scaleY = containerHeight / pageHeight;
      const newScale = Math.min(scaleX, scaleY);
      setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
    },
    [setScale]
  );

  const setZoomLevel = useCallback(
    (newScale: number) => {
      setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
    },
    [setScale]
  );

  // 키보드 줌 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + 또는 Ctrl/Cmd -
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          setScale(1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, setScale]);

  // 휠 줌 (Ctrl + 휠)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
        setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta)));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [scale, setScale]);

  return {
    scale,
    setScale: setZoomLevel,
    zoomIn,
    zoomOut,
    fitToWidth,
    fitToPage,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  };
}
