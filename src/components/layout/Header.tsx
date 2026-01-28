import { useRef, useState } from 'react';
import { Menu, Upload, FileText, FolderOpen, LogOut, User, ChevronDown, Building2, Copy, Check, Link, Loader2, Share2 } from 'lucide-react';
import { useStore } from '../../store';
import { usePDF } from '../../hooks/usePDF';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../hooks/useAuth';
import { useComplex } from '../../hooks/useComplex';
import { useDocumentLibrary } from '../../hooks/useDocumentLibrary';
import { createSharedLink, getShareUrl } from '../../api/sharedLinks';
import { TextSearch } from '../search/TextSearch';
import { MobileZoomControls } from '../pdf/controls/MobileZoomControls';
import { MobilePageNavigation } from '../pdf/controls/MobilePageNavigation';

export function Header() {
  const { toggleSidebar, viewMode, setViewMode, currentDocumentTitle } = useStore();
  const { document, documentId } = usePDF();
  const { isMobile, isTablet } = useResponsive();
  const { user, signOut } = useAuth();
  const { complex, isAdmin } = useComplex();
  const { toggleLibrary, uploadDocument } = useDocumentLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const handleCopyInviteCode = async () => {
    if (complex?.invite_code) {
      await navigator.clipboard.writeText(complex.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyInviteLink = async () => {
    if (complex?.invite_code) {
      const link = `${window.location.origin}/join/${complex.invite_code}`;
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!documentId || documentId === 'local') return;

    setIsSharing(true);
    try {
      const sharedLink = await createSharedLink(documentId);
      const url = getShareUrl(sharedLink.short_code);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 3000);
    } catch (error) {
      console.error('공유 링크 생성 실패:', error);
      alert('공유 링크를 생성할 수 없습니다.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // PDF 파일만 필터링
    const pdfFiles = Array.from(files).filter(
      (file) => file.type === 'application/pdf'
    );

    if (pdfFiles.length === 0) {
      alert('PDF 파일만 업로드할 수 있습니다.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: pdfFiles.length });

    const failedFiles: string[] = [];

    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      setUploadProgress({ current: i + 1, total: pdfFiles.length });

      try {
        const title = file.name.replace(/\.pdf$/i, '');
        await uploadDocument(title, file);
      } catch (error) {
        console.error(`업로드 실패 (${file.name}):`, error);
        failedFiles.push(file.name);
      }
    }

    if (failedFiles.length > 0) {
      alert(`${failedFiles.length}개 파일 업로드 실패:\n${failedFiles.join('\n')}`);
    } else if (pdfFiles.length > 0) {
      alert(`${pdfFiles.length}개 파일 업로드 완료`);
    }

    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
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

        {/* 파일 업로드 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {!isMobile && (
            <span className="text-sm">
              {isUploading
                ? `${uploadProgress.current}/${uploadProgress.total}`
                : '업로드'}
            </span>
          )}
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

        {/* 공유 버튼 */}
        {document && documentId && documentId !== 'local' && (
          <button
            onClick={handleShare}
            disabled={isSharing}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${
              copiedShareLink
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'border border-gray-300 hover:bg-gray-50'
            } disabled:opacity-50`}
            title={shareUrl || '공유 링크 생성'}
          >
            {isSharing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : copiedShareLink ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {!isMobile && (
              <span className="text-sm">
                {copiedShareLink ? '복사됨' : '공유'}
              </span>
            )}
          </button>
        )}

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
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-gray-500">초대 코드 / 링크</p>
                        <div className="flex gap-1">
                          <button
                            onClick={handleCopyInviteCode}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white border rounded text-sm font-mono hover:bg-gray-50"
                            title="코드 복사"
                          >
                            <span className="truncate">{complex.invite_code}</span>
                            {copiedCode ? (
                              <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                          <button
                            onClick={handleCopyInviteLink}
                            className="flex items-center gap-1.5 px-2 py-1.5 bg-primary-50 border border-primary-200 rounded text-sm text-primary-700 hover:bg-primary-100"
                            title="링크 복사"
                          >
                            {copiedLink ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Link className="w-3 h-3" />
                            )}
                            <span>링크</span>
                          </button>
                        </div>
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
