import { useCallback } from 'react';
import { useStore } from '../store';
import { usePDF } from './usePDF';
import { getDocument, getDocumentUrl } from '../api/documents';

export function useDocumentNavigation() {
  const { loadDocument, goToPage, documentId } = usePDF();
  const { setCurrentDocumentTitle, setLibraryOpen } = useStore();

  const navigateToLabel = useCallback(
    async (targetDocumentId: string, pageNumber: number) => {
      try {
        // 현재 문서와 다른 경우 해당 문서 로드
        if (documentId !== targetDocumentId) {
          const doc = await getDocument(targetDocumentId);
          if (!doc) {
            throw new Error('문서를 찾을 수 없습니다.');
          }

          const url = await getDocumentUrl(doc.file_path);
          await loadDocument(url, doc.id);
          setCurrentDocumentTitle(doc.title);
        }

        // 페이지 이동
        goToPage(pageNumber);

        // 라이브러리 패널 닫기
        setLibraryOpen(false);
      } catch (error) {
        console.error('문서 네비게이션 실패:', error);
        throw error;
      }
    },
    [documentId, loadDocument, goToPage, setCurrentDocumentTitle, setLibraryOpen]
  );

  const navigateToPage = useCallback(
    (pageNumber: number) => {
      goToPage(pageNumber);
    },
    [goToPage]
  );

  return {
    navigateToLabel,
    navigateToPage,
  };
}
