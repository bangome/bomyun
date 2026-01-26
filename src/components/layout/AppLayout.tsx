import type { ReactNode } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { DocumentLibrary } from '../library/DocumentLibrary';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isMobile } = useResponsive();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 헤더 */}
      <Header />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 사이드바 (데스크톱) */}
        {!isMobile && <Sidebar />}

        {/* PDF 뷰어 영역 */}
        <main className={`flex-1 overflow-hidden ${isMobile ? 'pb-16' : ''}`}>
          {children}
        </main>
      </div>

      {/* 모바일 하단 메뉴 */}
      {isMobile && <MobileMenu />}

      {/* 모바일 사이드바 (오버레이) */}
      {isMobile && <Sidebar />}

      {/* 문서 라이브러리 패널 */}
      <DocumentLibrary />
    </div>
  );
}
