import { useRef, useState } from 'react';
import { Menu, Upload, FileText, FolderOpen, LogOut, User, ChevronDown } from 'lucide-react';
import { useStore } from '../../store';
import { usePDF } from '../../hooks/usePDF';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../hooks/useAuth';
import { useDocumentLibrary } from '../../hooks/useDocumentLibrary';
import { TextSearch } from '../search/TextSearch';
import { ZoomControls } from '../pdf/controls/ZoomControls';
import { PageNavigation } from '../pdf/controls/PageNavigation';

export function Header() {
  const { toggleSidebar, viewMode, setViewMode, currentDocumentTitle } = useStore();
  const { loadFromFile, document } = usePDF();
  const { isMobile, isTablet } = useResponsive();
  const { user, signOut } = useAuth();
  const { toggleLibrary } = useDocumentLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      loadFromFile(file);
    }
    e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-4">
        {/* 메뉴 토글 (모바일/태블릿) */}
        {(isMobile || isTablet) && (
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* 로고/타이틀 */}
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary-500" />
          {!isMobile && (
            <span className="font-semibold text-gray-800">PDF 뷰어</span>
          )}
        </div>

        {/* 문서 라이브러리 버튼 */}
        <button
          onClick={toggleLibrary}
          className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          {!isMobile && <span className="text-sm">라이브러리</span>}
        </button>

        {/* 파일 업로드 (로컬) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleUploadClick}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {!isMobile && <span className="text-sm">로컬 파일</span>}
        </button>

        {/* 현재 문서 이름 */}
        {currentDocumentTitle && !isMobile && (
          <>
            <div className="w-px h-8 bg-gray-200" />
            <span className="text-sm text-gray-600 truncate max-w-40" title={currentDocumentTitle}>
              {currentDocumentTitle}
            </span>
          </>
        )}

        {/* 구분선 */}
        {document && <div className="w-px h-8 bg-gray-200" />}

        {/* 페이지 네비게이션 */}
        {document && !isMobile && <PageNavigation />}

        {/* 구분선 */}
        {document && !isMobile && <div className="w-px h-8 bg-gray-200" />}

        {/* 줌 컨트롤 */}
        {document && !isMobile && <ZoomControls />}

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 텍스트 검색 */}
        {document && !isMobile && (
          <div className="w-64">
            <TextSearch />
          </div>
        )}

        {/* 뷰 모드 선택 */}
        {document && !isMobile && (
          <>
            <div className="w-px h-8 bg-gray-200" />
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="single">단일 페이지</option>
              <option value="continuous">연속 스크롤</option>
              <option value="double">양면 보기</option>
            </select>
          </>
        )}

        {/* 사용자 메뉴 */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <User className="w-4 h-4 text-gray-600" />
            {!isMobile && (
              <>
                <span className="text-sm text-gray-700 max-w-24 truncate">
                  {user?.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </>
            )}
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 모바일 두 번째 줄 */}
      {document && isMobile && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
          <PageNavigation />
          <div className="flex-1" />
          <ZoomControls />
        </div>
      )}
    </header>
  );
}
