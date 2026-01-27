import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Edit2, Check, X } from 'lucide-react';
import { useStore } from '../../store';
import { upsertPageName, deletePageNameByPage } from '../../api/pageNames';

interface PageNameEditorProps {
  pageNumber: number;
  documentId: string;
}

export function PageNameEditor({ pageNumber, documentId }: PageNameEditorProps) {
  const { pageNames, addPageName, removePageName } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 현재 페이지의 이름 찾기
  const pageName = pageNames.find((p) => p.page_number === pageNumber);

  // 편집 시작
  const handleStartEdit = useCallback(() => {
    setEditValue(pageName?.name || '');
    setIsEditing(true);
  }, [pageName]);

  // 편집 완료
  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim();

    try {
      if (trimmedValue) {
        // 이름 저장 (upsert)
        const saved = await upsertPageName(documentId, pageNumber, trimmedValue);
        addPageName(saved);
      } else if (pageName) {
        // 빈 값이면 삭제
        await deletePageNameByPage(documentId, pageNumber);
        removePageName(pageName.id);
      }
    } catch (error) {
      console.error('페이지 이름 저장 실패:', error);
    }

    setIsEditing(false);
  }, [editValue, documentId, pageNumber, pageName, addPageName, removePageName]);

  // 편집 취소
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  // Enter 키로 저장, Escape 키로 취소
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // 편집 모드 시 input 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 이름이 없을 때는 작은 버튼만 표시
  if (!pageName && !isEditing) {
    return (
      <button
        onClick={handleStartEdit}
        className="absolute top-2 left-2 z-30 p-1.5 bg-white/80 hover:bg-white rounded-lg shadow-sm border border-gray-200 transition-all opacity-0 group-hover:opacity-100"
        title="페이지 이름 추가"
      >
        <FileText className="w-4 h-4 text-gray-500" />
      </button>
    );
  }

  // 편집 모드
  if (isEditing) {
    return (
      <div className="absolute top-2 left-2 z-30 flex items-center gap-1 bg-white rounded-lg shadow-md border border-gray-300 p-1">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="페이지 이름"
          className="w-32 px-2 py-1 text-xs border-0 focus:outline-none focus:ring-0"
        />
        <button
          onClick={handleSave}
          className="p-1 hover:bg-green-100 rounded text-green-600"
          title="저장"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 hover:bg-red-100 rounded text-red-600"
          title="취소"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // 이름 표시 모드 (pageName이 있을 때만 도달)
  if (!pageName) return null;

  return (
    <div
      className="absolute top-2 left-2 z-30 flex items-center gap-1 bg-white/90 hover:bg-white rounded-lg shadow-sm border border-gray-200 px-2 py-1 cursor-pointer transition-all group/name"
      onClick={handleStartEdit}
      title="클릭하여 편집"
    >
      <FileText className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
      <span className="text-xs font-medium text-gray-700 max-w-32 truncate">
        {pageName.name}
      </span>
      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover/name:opacity-100 transition-opacity" />
    </div>
  );
}
