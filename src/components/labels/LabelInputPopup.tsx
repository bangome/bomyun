import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

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

interface LabelInputPopupProps {
  position: { x: number; y: number }; // 화면 좌표 (픽셀)
  onSave: (text: string, color: string) => void;
  onCancel: () => void;
}

export function LabelInputPopup({ position, onSave, onCancel }: LabelInputPopupProps) {
  const [text, setText] = useState('');
  const [color, setColor] = useState(LABEL_COLORS[0]);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 팝업 위치 조정 (화면 밖으로 나가지 않도록)
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // 오른쪽으로 넘어가면 왼쪽으로 조정
      if (position.x + rect.width > viewportWidth - 20) {
        newX = viewportWidth - rect.width - 20;
      }

      // 아래로 넘어가면 위로 조정
      if (position.y + rect.height > viewportHeight - 20) {
        newY = position.y - rect.height - 10;
      }

      setAdjustedPosition({ x: Math.max(20, newX), y: Math.max(20, newY) });
    }
  }, [position]);

  useEffect(() => {
    // 자동 포커스
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text.trim(), color);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      ref={popupRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 w-72"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onKeyDown={handleKeyDown}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-800">라벨 추가</h4>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 텍스트 입력 */}
        <div className="mb-3">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="라벨 텍스트 입력"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* 색상 선택 */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">색상</label>
          <div className="flex gap-2 flex-wrap">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  color === c ? 'border-gray-800 scale-110' : 'border-gray-200'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </form>
    </div>
  );
}
