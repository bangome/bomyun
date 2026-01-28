import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { usePDF } from '../../hooks/usePDF';
import { useStore } from '../../store';
import { usePinchZoom } from '../../hooks/usePinchZoom';
import { useMousePan } from '../../hooks/useMousePan';
import { useResponsive } from '../../hooks/useResponsive';
import { useTextSearch } from '../../hooks/useTextSearch';
import { useDocumentLibrary } from '../../hooks/useDocumentLibrary';
import { PDFPage } from './PDFPage';
import { WelcomeScreen } from './WelcomeScreen';
import { LabelInputPopup } from '../labels/LabelInputPopup';
import { LabelEditModal } from '../labels/LabelEditModal';
import { PageNavigation } from './controls/PageNavigation';
import { ZoomControls } from './controls/ZoomControls';
import { Loader2 } from 'lucide-react';
import { createLabel, updateLabel } from '../../api/labels';
import type { Label } from '../../types/database.types';

// 빈 라벨 프리뷰 컴포넌트 (마우스를 따라다님)
function GhostLabel({ x, y }: { x: number; y: number }) {
  const bgColor = 'rgba(239, 68, 68, 0.6)'; // 기본 빨간색 60% 투명도

  return (
    <div
      className="fixed pointer-events-none z-50 flex items-center"
      style={{
        left: x,
        top: y,
        transform: 'translateY(-50%)',
      }}
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
        className="px-3 py-1 text-white text-xs font-medium whitespace-nowrap"
        style={{
          backgroundColor: bgColor,
          borderTop: '1px solid #EF4444',
          borderRight: '1px solid #EF4444',
          borderBottom: '1px solid #EF4444',
          minWidth: '60px',
        }}
      >
        &nbsp;
      </div>
    </div>
  );
}

interface PDFViewerProps {
  className?: string;
  initialDocumentId?: string;
}

export function PDFViewer({ className = '', initialDocumentId }: PDFViewerProps) {
  const { document, documentId, numPages, isLoading, error, getPage, currentPage, goToPage } = usePDF();
  const { openDocument } = useDocumentLibrary();
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);

  // URL에서 문서 ID가 있으면 해당 문서 로드
  useEffect(() => {
    if (initialDocumentId && !initialLoadAttempted && !document) {
      setInitialLoadAttempted(true);
      openDocument(initialDocumentId);
    }
  }, [initialDocumentId, initialLoadAttempted, document, openDocument]);
  const {
    scale,
    setScale,
    viewMode,
    setPageOriginalSize,
    setContainerSize,
    isLabelAddMode,
    pendingLabelPosition,
    setLabelAddMode,
    setPendingLabelPosition,
    addLabel,
    updateLabel: updateLabelInStore,
  } = useStore();
  const { isMobile } = useResponsive();
  const { currentMatchIndex, matches } = useTextSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const isScrollingToMatchRef = useRef(false);

  // 마우스 위치 추적 (라벨 추가 모드용)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // 팝업 위치 (화면 좌표)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  // 수정할 라벨
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  // 핀치 줌 (callback ref 반환) - 모바일용
  const pinchZoomRef = usePinchZoom({
    currentScale: scale,
    onZoomChange: setScale,
  });

  // 마우스 패닝 (callback ref 반환) - PC용 (라벨 추가 모드에서는 비활성화)
  const mousePanRef = useMousePan({
    enabled: !isMobile && !isLabelAddMode,
  });

  // ref 병합: pagesContainerRef, pinchZoomRef, mousePanRef 모두 연결
  const setRefs = useCallback(
    (element: HTMLDivElement | null) => {
      pagesContainerRef.current = element;
      pinchZoomRef(element); // 모바일 핀치 줌
      mousePanRef(element); // PC 마우스 패닝
    },
    [pinchZoomRef, mousePanRef]
  );

  // 마우스 이동 추적 (라벨 추가 모드)
  useEffect(() => {
    if (!isLabelAddMode) {
      setMousePosition(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLabelAddMode]);

  // 위치 선택 후 팝업 위치 설정
  useEffect(() => {
    if (pendingLabelPosition) {
      // pendingLabelPosition에서 화면 좌표 계산
      const container = pagesContainerRef.current;
      if (container) {
        const pageEl = container.querySelector(`[data-page-number="${pendingLabelPosition.pageNumber}"]`) as HTMLElement;
        if (pageEl) {
          const rect = pageEl.getBoundingClientRect();
          const screenX = rect.left + (pendingLabelPosition.x / 100) * rect.width;
          const screenY = rect.top + (pendingLabelPosition.y / 100) * rect.height;
          setPopupPosition({ x: screenX + 20, y: screenY });
        }
      }
    } else {
      setPopupPosition(null);
    }
  }, [pendingLabelPosition]);

  // 컨테이너 크기 추적
  useEffect(() => {
    if (!document) return;

    const updateContainerSize = () => {
      const container = pagesContainerRef.current;
      if (!container) return;

      // 스크롤 컨테이너의 실제 뷰포트 크기 (패딩 p-4 = 16px * 2 = 32px 제외)
      const availableWidth = container.clientWidth - 32;
      const availableHeight = container.clientHeight - 32;

      if (availableWidth > 0 && availableHeight > 0) {
        setContainerSize(availableWidth, availableHeight);
      }
    };

    // 초기 크기 설정 (DOM이 완전히 렌더링된 후)
    requestAnimationFrame(() => {
      updateContainerSize();
    });

    // ResizeObserver로 크기 변화 감지
    const container = pagesContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [setContainerSize, document]);

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

  // 라벨 클릭 시 해당 페이지로 이동
  const handleLabelClick = useCallback((label: Label) => {
    goToPage(label.page_number);
  }, [goToPage]);

  // 라벨 드래그 종료 시 위치 업데이트
  const handleLabelDragEnd = useCallback(async (label: Label, newX: number, newY: number) => {
    try {
      const updated = await updateLabel(label.id, {
        position_x: newX,
        position_y: newY,
      });
      updateLabelInStore(label.id, updated);
    } catch (error) {
      console.error('라벨 위치 업데이트 실패:', error);
    }
  }, [updateLabelInStore]);

  // 라벨 더블클릭 시 수정 모달 열기
  const handleLabelDoubleClick = useCallback((label: Label) => {
    setEditingLabel(label);
  }, []);

  // 라벨 수정 저장
  const handleSaveLabel = useCallback(async (labelId: string, text: string, color: string) => {
    const updated = await updateLabel(labelId, { text, color });
    updateLabelInStore(labelId, updated);
  }, [updateLabelInStore]);

  // 라벨 생성
  const handleCreateLabel = useCallback(async (text: string, color: string) => {
    if (!documentId || !pendingLabelPosition) return;

    try {
      const newLabel = await createLabel(
        documentId,
        pendingLabelPosition.pageNumber,
        text,
        color,
        pendingLabelPosition.x,
        pendingLabelPosition.y
      );
      addLabel(newLabel);
      setPendingLabelPosition(null);
      setPopupPosition(null);
    } catch (error) {
      console.error('라벨 추가 실패:', error);
    }
  }, [documentId, pendingLabelPosition, addLabel, setPendingLabelPosition]);

  // 라벨 추가 취소
  const handleCancelLabel = useCallback(() => {
    setPendingLabelPosition(null);
    setPopupPosition(null);
    setLabelAddMode(false);
  }, [setPendingLabelPosition, setLabelAddMode]);

  // 스크롤 시 현재 페이지 감지
  useEffect(() => {
    const container = pagesContainerRef.current;
    if (!container || viewMode !== 'continuous') return;

    const handleScroll = () => {
      // 검색 매치로 스크롤 중이면 페이지 감지 무시
      if (isScrollingToMatchRef.current) return;

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

  // 페이지 변경 시 스크롤 (검색 결과가 있으면 매치 스크롤에 위임)
  useEffect(() => {
    if (viewMode !== 'continuous') return;
    if (isScrollingToMatchRef.current) return; // 매치 스크롤 중이면 무시
    // 검색 결과가 있으면 매치 스크롤 effect에서 처리하므로 무시
    if (matches.length > 0 && currentMatchIndex >= 0) return;

    const container = pagesContainerRef.current;
    if (!container) return;

    const pageEl = container.querySelector(`[data-page-number="${currentPage}"]`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage, viewMode, matches.length, currentMatchIndex]);

  // 검색 매치로 스크롤
  useEffect(() => {
    if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;

    const container = pagesContainerRef.current;
    if (!container) return;

    const currentMatch = matches[currentMatchIndex];
    const targetPageNumber = currentMatch.pageIndex + 1;

    // 매치 스크롤 시작
    isScrollingToMatchRef.current = true;

    // 페이지 요소를 기반으로 스크롤 위치 계산
    const scrollToMatch = () => {
      const pageEl = container.querySelector(`[data-page-number="${targetPageNumber}"]`) as HTMLElement;

      if (!pageEl) {
        isScrollingToMatchRef.current = false;
        return;
      }

      // 페이지 요소의 실제 높이
      const pageHeight = pageEl.offsetHeight;

      // 매치의 상대 위치를 픽셀로 변환
      const matchTopInPage = (currentMatch.position.top / 100) * pageHeight;
      const matchHeight = (currentMatch.position.height / 100) * pageHeight;

      // 매치 중앙이 화면 중앙에 오도록 스크롤 위치 계산
      const matchCenterInPage = matchTopInPage + matchHeight / 2;
      const scrollTarget = pageEl.offsetTop + matchCenterInPage - container.clientHeight / 2;

      // 스크롤 실행
      container.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: 'smooth'
      });

      // 스크롤 완료 후 플래그 리셋 (여러 페이지 스크롤 시 더 오래 걸릴 수 있음)
      setTimeout(() => {
        isScrollingToMatchRef.current = false;
      }, 1000);
    };

    // 약간의 딜레이 후 실행 (DOM 업데이트 대기)
    requestAnimationFrame(() => {
      scrollToMatch();
    });
  }, [currentMatchIndex, matches]);

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
    return <WelcomeScreen className={className} />;
  }

  return (
    <div ref={containerRef} className={`h-full bg-gray-200 relative flex flex-col ${className}`}>
      {/* PC 툴바 - 캔버스 상단 */}
      {!isMobile && (
        <div className="flex-shrink-0 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 flex items-center justify-center gap-4">
          <PageNavigation />
          <div className="w-px h-6 bg-gray-300" />
          <ZoomControls />
        </div>
      )}

      <div
        ref={setRefs}
        className={`pdf-viewer-container flex-1 overflow-auto p-4 ${
          viewMode === 'continuous' ? 'space-y-4' : 'flex items-start justify-center'
        }`}
      >
        {viewMode === 'double' ? (
          <div className="flex gap-4 items-start justify-center">
            {pagesToRender.map((pageNum) => (
              <PDFPage key={pageNum} pageNumber={pageNum} documentId={documentId} getPage={getPage} onLabelClick={handleLabelClick} onLabelDoubleClick={handleLabelDoubleClick} onLabelDragEnd={handleLabelDragEnd} />
            ))}
          </div>
        ) : (
          pagesToRender.map((pageNum) => (
            <PDFPage key={pageNum} pageNumber={pageNum} documentId={documentId} getPage={getPage} onLabelClick={handleLabelClick} onLabelDoubleClick={handleLabelDoubleClick} onLabelDragEnd={handleLabelDragEnd} />
          ))
        )}
      </div>

      {/* 마우스를 따라다니는 프리뷰 라벨 */}
      {isLabelAddMode && mousePosition && !pendingLabelPosition && (
        <GhostLabel x={mousePosition.x} y={mousePosition.y} />
      )}

      {/* 라벨 입력 팝업 */}
      {pendingLabelPosition && popupPosition && (
        <LabelInputPopup
          position={popupPosition}
          onSave={handleCreateLabel}
          onCancel={handleCancelLabel}
        />
      )}

      {/* 라벨 수정 모달 */}
      {editingLabel && (
        <LabelEditModal
          label={editingLabel}
          onSave={handleSaveLabel}
          onClose={() => setEditingLabel(null)}
        />
      )}
    </div>
  );
}
