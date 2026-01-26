import { useEffect, useState, memo } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { usePDFPage } from '../../hooks/usePDFPage';
import { useStore } from '../../store';
import { Loader2 } from 'lucide-react';

interface PDFPageProps {
  pageNumber: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy | null>;
}

export const PDFPage = memo(function PDFPage({ pageNumber, getPage }: PDFPageProps) {
  const { scale, rotation } = useStore();
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const { canvasRef, textLayerRef, isRendering, dimensions } = usePDFPage({
    page,
    scale,
    rotation,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        const loadedPage = await getPage(pageNumber);
        if (!cancelled) {
          setPage(loadedPage);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('페이지 로드 실패'));
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [pageNumber, getPage]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-50 text-red-600 rounded-lg">
        <span>페이지 {pageNumber} 로드 실패: {error.message}</span>
      </div>
    );
  }

  return (
    <div
      className="relative bg-white shadow-lg mx-auto"
      style={{
        width: dimensions.width || 'auto',
        height: dimensions.height || 'auto',
      }}
      data-page-number={pageNumber}
    >
      {/* 로딩 오버레이 */}
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Canvas 레이어 */}
      <canvas ref={canvasRef} className="block" />

      {/* 텍스트 레이어 (검색/선택용) */}
      <div
        ref={textLayerRef}
        className="textLayer absolute inset-0 overflow-hidden pointer-events-none select-text"
        style={{ opacity: 1 }}
      />

      {/* 페이지 번호 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {pageNumber}
      </div>
    </div>
  );
});
