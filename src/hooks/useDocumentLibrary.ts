import { useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { getDocuments, createDocument, deleteDocument, getDocumentUrl } from '../api/documents';
import { useAuth } from './useAuth';
import type { Document } from '../types/database.types';

export function useDocumentLibrary() {
  const { isAuthenticated } = useAuth();
  const {
    libraryDocuments,
    isLibraryOpen,
    setLibraryDocuments,
    addLibraryDocument,
    removeLibraryDocument,
    toggleLibrary,
    setLibraryOpen,
  } = useStore();

  // 문서 목록 로드
  const loadDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const docs = await getDocuments();
      setLibraryDocuments(docs);
    } catch (error) {
      console.error('문서 목록 로드 실패:', error);
    }
  }, [isAuthenticated, setLibraryDocuments]);

  // 인증 상태 변경 시 문서 로드
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // 문서 업로드
  const uploadDocument = useCallback(
    async (title: string, file: File): Promise<Document> => {
      const doc = await createDocument(title, file);
      addLibraryDocument(doc);
      return doc;
    },
    [addLibraryDocument]
  );

  // 문서 삭제
  const removeDocument = useCallback(
    async (id: string) => {
      await deleteDocument(id);
      removeLibraryDocument(id);
    },
    [removeLibraryDocument]
  );

  // 문서 URL 가져오기
  const getDocUrl = useCallback(async (filePath: string): Promise<string> => {
    return getDocumentUrl(filePath);
  }, []);

  return {
    documents: libraryDocuments,
    isLibraryOpen,
    loadDocuments,
    uploadDocument,
    removeDocument,
    getDocUrl,
    toggleLibrary,
    setLibraryOpen,
  };
}
