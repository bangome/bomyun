import { useCallback, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { useStore } from '../store';
import { getLabels } from '../api/labels';
import { getPageNames } from '../api/pageNames';
import { getDocument as getDocumentFromDB, updateDocumentRotation } from '../api/documents';

// PDF.js Worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export function usePDF() {
  const {
    document,
    documentId,
    documentUrl,
    numPages,
    isLoading,
    error,
    rotation,
    setDocument,
    setLoading,
    setError,
    resetDocument,
    setLabels,
    setPageNames,
    currentPage,
    setCurrentPage,
    setRotation,
  } = useStore();

  const loadDocument = useCallback(
    async (url: string, id: string) => {
      setLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjs.getDocument({
          url,
          cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        setDocument(pdf, id, url);

        // 문서 정보, 라벨, 페이지 이름 로드
        const [docInfo, labels, pageNames] = await Promise.all([
          getDocumentFromDB(id),
          getLabels(id),
          getPageNames(id),
        ]);

        // 저장된 회전 정보 적용
        if (docInfo?.rotation) {
          setRotation(docInfo.rotation);
        } else {
          setRotation(0);
        }

        setLabels(labels);
        setPageNames(pageNames);
      } catch (err) {
        console.error('PDF 로드 실패:', err);
        setError(err instanceof Error ? err : new Error('PDF 로드 실패'));
      } finally {
        setLoading(false);
      }
    },
    [setDocument, setLoading, setError, setLabels, setPageNames, setRotation]
  );

  const loadFromFile = useCallback(
    async (file: File, id: string = 'local') => {
      setLoading(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        const url = URL.createObjectURL(file);
        setDocument(pdf, id, url);
      } catch (err) {
        console.error('PDF 로드 실패:', err);
        setError(err instanceof Error ? err : new Error('PDF 로드 실패'));
      } finally {
        setLoading(false);
      }
    },
    [setDocument, setLoading, setError]
  );

  const getPage = useCallback(
    async (pageNumber: number) => {
      if (!document) return null;
      if (pageNumber < 1 || pageNumber > numPages) return null;

      try {
        return await document.getPage(pageNumber);
      } catch (err) {
        console.error(`페이지 ${pageNumber} 로드 실패:`, err);
        return null;
      }
    },
    [document, numPages]
  );

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  const nextPage = useCallback(() => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, numPages, setCurrentPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, setCurrentPage]);

  // 90도 시계 방향 회전
  const rotateClockwise = useCallback(async () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);

    // DB에 회전 정보 저장 (로컬 파일이 아닌 경우)
    if (documentId && documentId !== 'local') {
      try {
        await updateDocumentRotation(documentId, newRotation);
      } catch (err) {
        console.error('회전 정보 저장 실패:', err);
      }
    }
  }, [rotation, setRotation, documentId]);

  // 90도 반시계 방향 회전
  const rotateCounterClockwise = useCallback(async () => {
    const newRotation = (rotation - 90 + 360) % 360;
    setRotation(newRotation);

    // DB에 회전 정보 저장 (로컬 파일이 아닌 경우)
    if (documentId && documentId !== 'local') {
      try {
        await updateDocumentRotation(documentId, newRotation);
      } catch (err) {
        console.error('회전 정보 저장 실패:', err);
      }
    }
  }, [rotation, setRotation, documentId]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          nextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          prevPage();
          break;
        case 'Home':
          goToPage(1);
          break;
        case 'End':
          goToPage(numPages);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, goToPage, numPages]);

  return {
    document,
    documentId,
    documentUrl,
    numPages,
    isLoading,
    error,
    currentPage,
    rotation,
    loadDocument,
    loadFromFile,
    getPage,
    goToPage,
    nextPage,
    prevPage,
    rotateClockwise,
    rotateCounterClockwise,
    resetDocument,
  };
}
