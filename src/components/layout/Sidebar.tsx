import { useState } from 'react';
import { X, Tag, Search, FileText } from 'lucide-react';
import { useStore } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import { LabelManager } from '../labels/LabelManager';
import { GlobalLabelSearch } from '../search/GlobalLabelSearch';
import { PageList } from '../pages/PageList';

type TabType = 'pages' | 'labels' | 'search';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const { isSidebarOpen, toggleSidebar } = useStore();
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState<TabType>('pages');

  const isOverlay = isMobile || isTablet;

  if (!isSidebarOpen) return null;

  const tabs = [
    { id: 'pages' as const, label: '페이지', icon: FileText },
    { id: 'labels' as const, label: '라벨', icon: Tag },
    { id: 'search' as const, label: '검색', icon: Search },
  ];

  return (
    <>
      {/* 오버레이 배경 (모바일/태블릿) */}
      {isOverlay && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          ${isOverlay ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
          w-80 bg-white border-r border-gray-200 flex flex-col
          ${isOverlay ? 'shadow-xl' : ''}
          ${className}
        `}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {!isMobile && tab.label}
              </button>
            ))}
          </div>

          {isOverlay && (
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'pages' && <PageList />}
          {activeTab === 'labels' && <LabelManager />}
          {activeTab === 'search' && <GlobalLabelSearch />}
        </div>
      </aside>
    </>
  );
}
