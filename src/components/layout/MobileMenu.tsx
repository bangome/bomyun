import { useState } from 'react';
import { Search, Tag, Bookmark, X } from 'lucide-react';
import { usePDF } from '../../hooks/usePDF';
import { TextSearch } from '../search/TextSearch';
import { LabelManager } from '../labels/LabelManager';
import { BookmarkList } from '../bookmarks/BookmarkList';

type PanelType = 'search' | 'labels' | 'bookmarks' | null;

export function MobileMenu() {
  const { document } = usePDF();
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  if (!document) return null;

  const togglePanel = (panel: PanelType) => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  const menuItems = [
    { id: 'search' as const, label: '검색', icon: Search },
    { id: 'labels' as const, label: '라벨', icon: Tag },
    { id: 'bookmarks' as const, label: '북마크', icon: Bookmark },
  ];

  return (
    <>
      {/* 오버레이 패널 */}
      {activePanel && (
        <div className="fixed inset-x-0 bottom-16 top-0 z-40">
          {/* 배경 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setActivePanel(null)}
          />

          {/* 패널 콘텐츠 */}
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl shadow-xl max-h-[70vh] flex flex-col">
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">
                {menuItems.find((item) => item.id === activePanel)?.label}
              </h3>
              <button
                onClick={() => setActivePanel(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 패널 내용 */}
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'search' && (
                <div className="p-4">
                  <TextSearch autoFocus />
                </div>
              )}
              {activePanel === 'labels' && <LabelManager />}
              {activePanel === 'bookmarks' && <BookmarkList />}
            </div>
          </div>
        </div>
      )}

      {/* 하단 메뉴 바 */}
      <nav className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => togglePanel(item.id)}
              className={`
                flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors
                ${
                  activePanel === item.id
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
