import { useEffect, useRef, useState, useCallback } from 'react';
import type { PDFPageProxy, RenderTask } from 'pdfjs-dist';

interface UsePDFPageOptions {
  page: PDFPageProxy | null;
  scale: number;
  rotation?: number;
}

interface UsePDFPageResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  textLayerRef: React.RefObject<HTMLDivElement | null>;
  isRendering: boolean;
  dimensions: { width: number; height: number };
}

export function usePDFPage({
  page,
  scale,
  rotation = 0,
}: UsePDFPageOptions): UsePDFPageResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !page) return;

    // 이전 렌더링 취소
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    setIsRendering(true);

    try {
      const viewport = page.getViewport({ scale, rotation });
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context를 가져올 수 없습니다.');
      }

      // 고해상도 디스플레이 지원
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      setDimensions({ width: viewport.width, height: viewport.height });

      const transform =
        outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] as [number, number, number, number, number, number] : undefined;

      renderTaskRef.current = page.render({
        canvasContext: context,
        viewport,
        transform,
      } as any);

      await renderTaskRef.current.promise;

      // 텍스트 레이어 렌더링
      if (textLayerRef.current) {
        const textContent = await page.getTextContent();
        textLayerRef.current.innerHTML = '';
        textLayerRef.current.style.width = `${viewport.width}px`;
        textLayerRef.current.style.height = `${viewport.height}px`;

        // 텍스트 아이템 렌더링
        for (const item of textContent.items) {
          if ('str' in item && item.str) {
            const textItem = item as any;
            const tx = textItem.transform;
            const span = document.createElement('span');
            span.textContent = item.str;

            // 폰트 크기 및 위치 계산
            const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) * scale;
            const angle = Math.atan2(tx[1], tx[0]);

            span.style.left = `${tx[4] * scale}px`;
            span.style.top = `${viewport.height - tx[5] * scale - fontSize}px`;
            span.style.fontSize = `${fontSize}px`;
            span.style.fontFamily = textItem.fontName || 'sans-serif';

            if (angle !== 0) {
              span.style.transform = `rotate(${-angle}rad)`;
            }

            textLayerRef.current.appendChild(span);
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'RenderingCancelledException') {
        console.error('페이지 렌더링 오류:', error);
      }
    } finally {
      setIsRendering(false);
    }
  }, [page, scale, rotation]);

  useEffect(() => {
    renderPage();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [renderPage]);

  return {
    canvasRef,
    textLayerRef,
    isRendering,
    dimensions,
  };
}
