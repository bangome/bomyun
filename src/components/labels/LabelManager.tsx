import { useState, useCallback } from 'react';
import { Plus, Search, Tag, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { usePDF } from '../../hooks/usePDF';
import { useResponsive } from '../../hooks/useResponsive';
import { updateLabel, deleteLabel } from '../../api/labels';
import type { Label } from '../../types/database.types';

const LABEL_COLORS = [
  '#EF4444', // Red (기본)
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

interface LabelEditFormProps {
  label: Label;
  onSave: (text: string, color: string) => void;
  onCancel: () => void;
}

function LabelEditForm({ label, onSave, onCancel }: LabelEditFormProps) {
  const [text, setText] = useState(label.text);
  const [color, setColor] = useState(label.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text.trim(), color);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b">
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          페이지 {label.page_number} 라벨 수정
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="라벨 텍스트 입력"
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
        <div className="flex gap-2 flex-wrap">
          {LABEL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === c ? 'border-gray-800 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          수정
        </button>
      </div>
    </form>
  );
}

export function LabelManager() {
  const { goToPage } = usePDF();
  const { isMobile } = useResponsive();
  const {
    labels,
    updateLabel: updateLabelStore,
    removeLabel,
    isLabelAddMode,
    pendingLabelPosition,
    setLabelAddMode,
    setPendingLabelPosition,
    toggleSidebar,
  } = useStore();

  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLabels = labels.filter((label) => {
    if (!searchQuery) return true;
    return label.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 라벨 추가 모드 시작 (위치 선택 모드)
  const handleStartAddMode = useCallback(() => {
    setLabelAddMode(true);
    setPendingLabelPosition(null);
    setEditingLabel(null);
    // 모바일에서는 사이드바를 닫아서 PDF를 볼 수 있게 함
    if (isMobile) {
      toggleSidebar();
    }
  }, [setLabelAddMode, setPendingLabelPosition, isMobile, toggleSidebar]);

  // 라벨 추가 모드 취소
  const handleCancelAddMode = useCallback(() => {
    setLabelAddMode(false);
    setPendingLabelPosition(null);
  }, [setLabelAddMode, setPendingLabelPosition]);

  const handleUpdateLabel = useCallback(async (text: string, color: string) => {
    if (!editingLabel) return;

    try {
      const updated = await updateLabel(editingLabel.id, { text, color });
      updateLabelStore(editingLabel.id, updated);
      setEditingLabel(null);
    } catch (error) {
      console.error('라벨 수정 실패:', error);
    }
  }, [editingLabel, updateLabelStore]);

  const handleDeleteLabel = useCallback(async (labelId: string) => {
    try {
      await deleteLabel(labelId);
      removeLabel(labelId);
    } catch (error) {
      console.error('라벨 삭제 실패:', error);
    }
  }, [removeLabel]);

  const handleLabelClick = useCallback((label: Label) => {
    goToPage(label.page_number);
  }, [goToPage]);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            라벨
          </h3>
          <button
            onClick={handleStartAddMode}
            disabled={isLabelAddMode || !!pendingLabelPosition}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="라벨 추가"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="라벨 검색..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* 라벨 추가 모드 안내 (위치 선택 대기) */}
      {isLabelAddMode && !pendingLabelPosition && (
        <div className="p-4 border-b bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">라벨 위치 선택</p>
              <p className="text-xs text-blue-600 mt-1">
                PDF 페이지에서 원하는 위치를 클릭하세요
              </p>
            </div>
            <button
              onClick={handleCancelAddMode}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 위치 선택 후 입력 대기 안내 */}
      {pendingLabelPosition && (
        <div className="p-4 border-b bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">라벨 정보 입력</p>
              <p className="text-xs text-green-600 mt-1">
                페이지 {pendingLabelPosition.pageNumber}에 배치됩니다
              </p>
            </div>
            <button
              onClick={handleCancelAddMode}
              className="px-3 py-1 text-sm text-green-600 hover:bg-green-100 rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 라벨 수정 폼 */}
      {editingLabel && (
        <LabelEditForm
          label={editingLabel}
          onSave={handleUpdateLabel}
          onCancel={() => setEditingLabel(null)}
        />
      )}

      {/* 라벨 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filteredLabels.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchQuery ? '검색 결과가 없습니다' : '라벨이 없습니다'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredLabels.map((label) => (
              <div
                key={label.id}
                className="p-3 hover:bg-gray-50 cursor-pointer group"
                onClick={() => handleLabelClick(label)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {label.text}
                    </p>
                    <p className="text-xs text-gray-500">
                      페이지 {label.page_number}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLabel(label);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="수정"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLabel(label.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
