import { useEffect, useState, memo, useCallback } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { usePDFPage } from '../../hooks/usePDFPage';
import { useStore } from '../../store';
import { useTextSearch } from '../../hooks/useTextSearch';
import { Loader2 } from 'lucide-react';
import { PageLabel } from '../labels/PageLabel';
import { PageNameEditor } from '../pages/PageNameEditor';
import type { Label } from '../../types/database.types';

interface PDFPageProps {
  pageNumber: number;
  documentId: string | null;
  getPage: (pageNumber: number) => Promise<PDFPageProxy | null>;
  onLabelClick?: (label: Label) => void;
  onLabelDoubleClick?: (label: Label) => void;
  onLabelDragEnd?: (label: Label, newX: number, newY: number) => void;
}

export const PDFPage = memo(function PDFPage({ pageNumber, documentId, getPage, onLabelClick, onLabelDoubleClick, onLabelDragEnd }: PDFPageProps) {
  const { scale, rotation, labels, isLabelAddMode, pendingLabelPosition, setLabelAddMode, setPendingLabelPosition } = useStore();
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { getMatchesForPage, currentMatchIndex, matches } = useTextSearch();

  // 현재 페이지의 라벨들
  const pageLabels = labels.filter((label) => label.page_number === pageNumber);

  const { canvasRef, textLayerRef, isRendering, dimensions } = usePDFPage({
    page,
    scale,
    rotation,
  });

  // 현재 페이지의 검색 매치
  const pageMatches = getMatchesForPage(pageNumber - 1);

  // 현재 활성 매치 확인
  const currentMatch = matches[currentMatchIndex];
  const isCurrentMatchOnThisPage = currentMatch?.pageIndex === pageNumber - 1;

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

  // 라벨 추가 모드에서 페이지 클릭 처리 - 위치만 저장
  const handlePageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLabelAddMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // 위치 저장 후 라벨 추가 모드 종료 (LabelManager에서 입력 폼 표시)
    setPendingLabelPosition({ pageNumber, x, y });
    setLabelAddMode(false);
  }, [isLabelAddMode, pageNumber, setLabelAddMode, setPendingLabelPosition]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-50 text-red-600 rounded-lg">
        <span>페이지 {pageNumber} 로드 실패: {error.message}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-white shadow-lg mx-auto group ${isLabelAddMode ? 'cursor-crosshair' : ''}`}
      style={{
        width: dimensions.width || 'auto',
        height: dimensions.height || 'auto',
      }}
      data-page-number={pageNumber}
      onClick={handlePageClick}
    >
      {/* 페이지 이름 편집기 (좌측 상단) */}
      {documentId && (
        <PageNameEditor pageNumber={pageNumber} documentId={documentId} />
      )}

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

      {/* 검색 하이라이트 레이어 */}
      {pageMatches.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {pageMatches
            .filter((match) => match.position.width > 0 && match.position.height > 0)
            .map((match) => {
              const isCurrentMatch = isCurrentMatchOnThisPage &&
                matches.findIndex(m => m.pageIndex === match.pageIndex && m.matchIndex === match.matchIndex) === currentMatchIndex;

              return (
                <div
                  key={`${match.pageIndex}-${match.matchIndex}`}
                  data-match-index={matches.findIndex(m => m.pageIndex === match.pageIndex && m.matchIndex === match.matchIndex)}
                  className={`absolute transition-colors ${
                    isCurrentMatch
                      ? 'bg-orange-400/60 ring-2 ring-orange-500'
                      : 'bg-yellow-300/50'
                  }`}
                  style={{
                    left: `${match.position.left}%`,
                    top: `${match.position.top}%`,
                    width: `${match.position.width}%`,
                    height: `${match.position.height}%`,
                  }}
                />
              );
            })}
        </div>
      )}

      {/* 라벨 레이어 */}
      {pageLabels.map((label) => (
        <PageLabel
          key={label.id}
          label={label}
          onClick={onLabelClick}
          onDoubleClick={onLabelDoubleClick}
          onDragEnd={onLabelDragEnd}
        />
      ))}

      {/* 클릭 후 배치된 빈 라벨 프리뷰 (입력 대기 중) */}
      {pendingLabelPosition && pendingLabelPosition.pageNumber === pageNumber && (
        <div
          className="absolute flex items-center z-20 pointer-events-none"
          style={{
            left: `${pendingLabelPosition.x}%`,
            top: `${pendingLabelPosition.y}%`,
            transform: 'translateY(-50%)',
          }}
        >
          {/* 왼쪽 뾰족한 부분 */}
          <div
            className="w-0 h-0 flex-shrink-0"
            style={{
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderRight: '10px solid rgba(239, 68, 68, 0.6)',
            }}
          />
          {/* 직사각형 텍스트 영역 */}
          <div
            className="px-3 py-1 text-white text-xs font-medium whitespace-nowrap animate-pulse"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.6)',
              borderTop: '1px solid #EF4444',
              borderRight: '1px solid #EF4444',
              borderBottom: '1px solid #EF4444',
              minWidth: '60px',
            }}
          >
            &nbsp;
          </div>
        </div>
      )}

      {/* 라벨 추가 모드 오버레이 */}
      {isLabelAddMode && (
        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
      )}

      {/* 페이지 번호 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {pageNumber}
      </div>
    </div>
  );
});
