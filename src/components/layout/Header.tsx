import { useRef, useState } from 'react';
import { Menu, Upload, FileText, FolderOpen, LogOut, User, ChevronDown, Building2, Copy, Check } from 'lucide-react';
import { useStore } from '../../store';
import { usePDF } from '../../hooks/usePDF';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../hooks/useAuth';
import { useComplex } from '../../hooks/useComplex';
import { useDocumentLibrary } from '../../hooks/useDocumentLibrary';
import { TextSearch } from '../search/TextSearch';
import { ZoomControls } from '../pdf/controls/ZoomControls';
import { PageNavigation } from '../pdf/controls/PageNavigation';
import { MobileZoomControls } from '../pdf/controls/MobileZoomControls';
import { MobilePageNavigation } from '../pdf/controls/MobilePageNavigation';

export function Header() {
  const { toggleSidebar, viewMode, setViewMode, currentDocumentTitle } = useStore();
  const { loadFromFile, document } = usePDF();
  const { isMobile, isTablet } = useResponsive();
  const { user, signOut } = useAuth();
  const { complex, isAdmin } = useComplex();
  const { toggleLibrary } = useDocumentLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyInviteCode = async () => {
    if (complex?.invite_code) {
      await navigator.clipboard.writeText(complex.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

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
    <header className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* 메뉴 토글 (모바일/태블릿) */}
        {(isMobile || isTablet) && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* 로고/타이틀 - 데스크톱만 */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-500" />
            <span className="font-semibold text-gray-800">PDF 뷰어</span>
          </div>
        )}

        {/* 문서 라이브러리 버튼 */}
        <button
          onClick={toggleLibrary}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
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
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {!isMobile && <span className="text-sm">로컬 파일</span>}
        </button>


        {/* 현재 문서 이름 - 데스크톱 */}
        {currentDocumentTitle && !isMobile && (
          <>
            <div className="w-px h-8 bg-gray-200" />
            <span className="text-sm text-gray-600 truncate max-w-40" title={currentDocumentTitle}>
              {currentDocumentTitle}
            </span>
          </>
        )}

        {/* 구분선 - 데스크톱 */}
        {document && !isMobile && <div className="w-px h-8 bg-gray-200" />}

        {/* 페이지 네비게이션 - 데스크톱 */}
        {document && !isMobile && <PageNavigation />}

        {/* 구분선 - 데스크톱 */}
        {document && !isMobile && <div className="w-px h-8 bg-gray-200" />}

        {/* 줌 컨트롤 - 데스크톱 */}
        {document && !isMobile && <ZoomControls />}

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 모바일: 줌 컨트롤 */}
        {document && isMobile && <MobileZoomControls />}

        {/* 텍스트 검색 - 데스크톱 */}
        {document && !isMobile && (
          <div className="w-64">
            <TextSearch />
          </div>
        )}

        {/* 뷰 모드 선택 - 데스크톱 */}
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
            className="flex items-center gap-1 sm:gap-2 p-1.5 sm:px-3 sm:py-2 hover:bg-gray-100 rounded-lg transition-colors"
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
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                {/* 사용자 정보 */}
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                </div>

                {/* 단지 정보 */}
                {complex && (
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{complex.name}</span>
                      {isAdmin && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                          관리자
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">초대 코드</p>
                        <button
                          onClick={handleCopyInviteCode}
                          className="flex items-center gap-2 px-2 py-1 bg-white border rounded text-sm font-mono hover:bg-gray-50"
                        >
                          <span>{complex.invite_code}</span>
                          {copiedCode ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

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

      {/* 모바일: 페이지 네비게이션 (두 번째 줄) */}
      {document && isMobile && (
        <div className="flex items-center justify-center mt-2 pt-2 border-t border-gray-100">
          <MobilePageNavigation />
        </div>
      )}
    </header>
  );
}
