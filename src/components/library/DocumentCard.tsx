import { useRef, useCallback } from 'react';
import { FileText, Trash2, ExternalLink, GripVertical, Check } from 'lucide-react';
import type { Document } from '../../types/database.types';

interface DocumentCardProps {
  document: Document;
  isActive?: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  isMobile?: boolean;
  onSelect: (doc: Document, e: React.MouseEvent) => void;
  onOpen: (doc: Document) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, doc: Document) => void;
  onTouchDragStart?: (doc: Document, touch: React.Touch) => void;
  onTouchDragMove?: (touch: React.Touch) => void;
  onTouchDragEnd?: () => void;
}

export function DocumentCard({
  document,
  isActive,
  isSelected,
  isSelectionMode,
  isMobile,
  onSelect,
  onOpen,
  onDelete,
  onDragStart,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
}: DocumentCardProps) {
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`"${document.title}" 문서를 삭제하시겠습니까?`)) {
      onDelete(document.id);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // 모바일에서는 터치 이벤트로 처리
    if (isMobile) return;
    onSelect(document, e);
  };

  const handleDoubleClick = () => {
    // 모바일에서는 터치 이벤트로 처리
    if (isMobile) return;
    onOpen(document);
  };

  const handleDragStart = (e: React.DragEvent) => {
    // 모바일에서는 터치 드래그로 처리
    if (isMobile) {
      e.preventDefault();
      return;
    }
    onDragStart(e, document);
  };

  // 터치 이벤트 핸들러 (모바일용)
  // 일반 모드: 터치→실행
  // 선택 모드: 터치→선택/해제, 선택된 문서 드래그→폴더이동
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isDragging.current = false;
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStartPos.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // 선택 모드에서 선택된 문서를 10px 이상 드래그하면 이동 시작
    if (isSelectionMode && isSelected && (deltaX > 10 || deltaY > 10)) {
      if (!isDragging.current && onTouchDragStart) {
        isDragging.current = true;

        // 진동 피드백
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }

        onTouchDragStart(document, touch);
      }
    }

    // 드래그 중이면 드래그 이벤트 전달
    if (isDragging.current && onTouchDragMove) {
      e.preventDefault();
      onTouchDragMove(touch);
    }
  }, [isMobile, isSelectionMode, isSelected, document, onTouchDragStart, onTouchDragMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;

    // 드래그 종료
    if (isDragging.current && onTouchDragEnd) {
      onTouchDragEnd();
      isDragging.current = false;
      touchStartPos.current = null;
      return;
    }

    // 짧은 터치
    if (isSelectionMode) {
      // 선택 모드: 선택/해제 (실행 안함)
      onSelect(document, e as any);
    } else {
      // 일반 모드: 바로 실행
      onOpen(document);
    }

    touchStartPos.current = null;
  }, [isMobile, isSelectionMode, document, onSelect, onOpen, onTouchDragEnd]);

  return (
    <div
      draggable={!isMobile}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`
        group p-4 rounded-lg border cursor-pointer transition-all select-none
        ${isSelected
          ? 'border-primary-500 bg-primary-100 ring-2 ring-primary-300'
          : isActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* 드래그 핸들 (PC) 또는 선택 체크박스 (모바일 선택 모드) */}
        {isMobile && isSelectionMode ? (
          <div className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${isSelected
              ? 'bg-primary-500 border-primary-500'
              : 'border-gray-300 bg-white'
            }
          `}>
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        ) : !isMobile ? (
          <div className="opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        ) : null}

        <div className={`
          p-2 rounded-lg flex-shrink-0
          ${isSelected
            ? 'bg-primary-200'
            : isActive
              ? 'bg-primary-100'
              : 'bg-gray-100 group-hover:bg-primary-100'
          }
        `}>
          <FileText className={`w-5 h-5 ${
            isSelected || isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate" title={document.title}>
            {document.title}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span>{formatDate(document.created_at)}</span>
            <span>{formatFileSize(document.file_size)}</span>
            {document.page_count && <span>{document.page_count}페이지</span>}
          </div>
        </div>

        {/* 액션 버튼 (모바일 선택 모드가 아닐 때만) */}
        {!(isMobile && isSelectionMode) && (
          <div className={`flex items-center gap-1 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen(document);
              }}
              className="p-1.5 hover:bg-primary-100 rounded text-gray-400 hover:text-primary-600"
              title="열기"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
