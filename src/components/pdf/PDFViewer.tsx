import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { usePDF } from '../../hooks/usePDF';
import { useStore } from '../../store';
import { usePinchZoom } from '../../hooks/usePinchZoom';
import { PDFPage } from './PDFPage';
import { Loader2 } from 'lucide-react';

interface PDFViewerProps {
  className?: string;
}

export function PDFViewer({ className = '' }: PDFViewerProps) {
  const { document, numPages, isLoading, error, getPage, currentPage, goToPage } = usePDF();
  const { scale, setScale, viewMode, setPageOriginalSize, setContainerSize } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  // 핀치 줌
  const pinchZoomRef = usePinchZoom({
    currentScale: scale,
    onZoomChange: setScale,
  });

  // ref 병합
  const setRefs = useCallback(
    (element: HTMLDivElement | null) => {
      (pagesContainerRef as any).current = element;
      (pinchZoomRef as any).current = element;
    },
    [pinchZoomRef]
  );

  // 컨테이너 크기 추적
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateContainerSize = () => {
      // 외부 컨테이너 크기에서 내부 padding (p-4 = 16px * 2) 제외
      const availableWidth = container.clientWidth - 32;
      const availableHeight = container.clientHeight - 32;
      setContainerSize(Math.max(0, availableWidth), Math.max(0, availableHeight));
    };

    updateContainerSize();

    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [setContainerSize]);

  // 첫 페이지 원본 크기 가져오기
  useEffect(() => {
    if (!document || pageLoaded) return;

    async function loadFirstPageSize() {
      try {
        const page = await document!.getPage(1);
        const viewport = page.getViewport({ scale: 1, rotation: 0 });
        setPageOriginalSize(viewport.width, viewport.height);
        setPageLoaded(true);
      } catch (err) {
        console.error('첫 페이지 크기 로드 실패:', err);
      }
    }

    loadFirstPageSize();
  }, [document, pageLoaded, setPageOriginalSize]);

  // 문서 변경 시 pageLoaded 리셋
  useEffect(() => {
    setPageLoaded(false);
  }, [document]);

  // 스크롤 시 현재 페이지 감지
  useEffect(() => {
    const container = pagesContainerRef.current;
    if (!container || viewMode !== 'continuous') return;

    const handleScroll = () => {
      const pages = container.querySelectorAll('[data-page-number]');
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      let closestPage = 1;
      let closestDistance = Infinity;

      pages.forEach((pageEl) => {
        const rect = pageEl.getBoundingClientRect();
        const pageCenter = rect.top + rect.height / 2;
        const distance = Math.abs(pageCenter - containerCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = parseInt(pageEl.getAttribute('data-page-number') || '1');
        }
      });

      if (closestPage !== currentPage) {
        goToPage(closestPage);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [viewMode, currentPage, goToPage]);

  // 페이지 변경 시 스크롤
  useEffect(() => {
    if (viewMode !== 'continuous') return;

    const container = pagesContainerRef.current;
    if (!container) return;

    const pageEl = container.querySelector(`[data-page-number="${currentPage}"]`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage, viewMode]);

  // 렌더링할 페이지 계산
  const pagesToRender = useMemo(() => {
    if (!document) return [];

    if (viewMode === 'continuous') {
      // 연속 모드: 모든 페이지 렌더링
      return Array.from({ length: numPages }, (_, i) => i + 1);
    } else if (viewMode === 'double') {
      // 양면 모드: 현재 페이지와 다음 페이지
      const pages = [currentPage];
      if (currentPage < numPages) {
        pages.push(currentPage + 1);
      }
      return pages;
    } else {
      // 단일 모드: 현재 페이지만
      return [currentPage];
    }
  }, [document, viewMode, currentPage, numPages]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
          <span className="text-gray-600">PDF 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className}`}>
        <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-md text-center">
          <h3 className="font-semibold mb-2">PDF 로드 실패</h3>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className}`}>
        <div className="text-gray-500 text-center">
          <p className="text-lg mb-2">PDF 파일을 선택해주세요</p>
          <p className="text-sm">파일을 업로드하거나 URL을 입력하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`h-full bg-gray-200 ${className}`}>
      <div
        ref={setRefs}
        className={`h-full overflow-auto p-4 ${
          viewMode === 'continuous' ? 'space-y-4' : 'flex items-start justify-center'
        }`}
      >
        {viewMode === 'double' ? (
          <div className="flex gap-4 items-start justify-center">
            {pagesToRender.map((pageNum) => (
              <PDFPage key={pageNum} pageNumber={pageNum} getPage={getPage} />
            ))}
          </div>
        ) : (
          pagesToRender.map((pageNum) => (
            <PDFPage key={pageNum} pageNumber={pageNum} getPage={getPage} />
          ))
        )}
      </div>
    </div>
  );
}
