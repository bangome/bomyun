import { useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { getDocuments, createDocument, deleteDocument, getDocumentUrl, getDocument } from '../api/documents';
import { getLabels } from '../api/labels';
import { getPageNames } from '../api/pageNames';
import {
  getFolders,
  createFolder as apiCreateFolder,
  updateFolder as apiUpdateFolder,
  deleteFolder as apiDeleteFolder,
  getFolderPath,
  moveDocumentToFolder as apiMoveDocumentToFolder,
  getDocumentsInFolder,
} from '../api/folders';
import { useAuth } from './useAuth';
import * as pdfjs from 'pdfjs-dist';
import type { Document, Folder } from '../types/database.types';

export function useDocumentLibrary() {
  const { isAuthenticated } = useAuth();
  const {
    libraryDocuments,
    isLibraryOpen,
    folders,
    currentFolderId,
    folderPath,
    setLibraryDocuments,
    addLibraryDocument,
    removeLibraryDocument,
    setFolders,
    addFolder,
    updateFolder: updateFolderInStore,
    removeFolder: removeFolderFromStore,
    setCurrentFolderId,
    setFolderPath,
    toggleLibrary,
    setLibraryOpen,
    setDocument,
    setLoading,
    setError,
    setLabels,
    setPageNames,
    setRotation,
    setCurrentDocumentTitle,
  } = useStore();

  // 현재 폴더의 문서와 하위 폴더 로드
  const loadCurrentFolder = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // 현재 폴더의 문서 로드
      const docs = await getDocumentsInFolder(currentFolderId);
      setLibraryDocuments(docs);

      // 현재 폴더의 하위 폴더 로드
      const subFolders = await getFolders(currentFolderId);
      setFolders(subFolders);

      // 폴더 경로 업데이트
      if (currentFolderId) {
        const path = await getFolderPath(currentFolderId);
        setFolderPath(path);
      } else {
        setFolderPath([]);
      }
    } catch (error) {
      console.error('폴더 로드 실패:', error);
    }
  }, [isAuthenticated, currentFolderId, setLibraryDocuments, setFolders, setFolderPath]);

  // 전체 문서 로드 (검색용)
  const loadAllDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const docs = await getDocuments();
      setLibraryDocuments(docs);
    } catch (error) {
      console.error('문서 목록 로드 실패:', error);
    }
  }, [isAuthenticated, setLibraryDocuments]);

  // 인증 상태나 현재 폴더 변경 시 로드
  useEffect(() => {
    loadCurrentFolder();
  }, [loadCurrentFolder]);

  // 문서 업로드 (현재 폴더에)
  const uploadDocument = useCallback(
    async (title: string, file: File): Promise<Document> => {
      const doc = await createDocument(title, file, currentFolderId);
      addLibraryDocument(doc);
      return doc;
    },
    [addLibraryDocument, currentFolderId]
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

  // 문서 열기 (ID로)
  const openDocument = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);

    try {
      // 문서 정보 조회
      const doc = await getDocument(documentId);
      if (!doc) {
        throw new Error('문서를 찾을 수 없습니다.');
      }

      // PDF URL 가져오기
      const url = await getDocumentUrl(doc.file_path);

      // PDF 로드
      const loadingTask = pdfjs.getDocument({
        url,
        cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;
      setDocument(pdf, documentId, url);
      setCurrentDocumentTitle(doc.title);

      // 라벨, 페이지 이름 로드
      const [labels, pageNames] = await Promise.all([
        getLabels(documentId),
        getPageNames(documentId),
      ]);

      setLabels(labels);
      setPageNames(pageNames);

      // 회전 정보 적용
      if (doc.rotation) {
        setRotation(doc.rotation);
      } else {
        setRotation(0);
      }
    } catch (err) {
      console.error('문서 열기 실패:', err);
      setError(err instanceof Error ? err : new Error('문서를 열 수 없습니다.'));
    } finally {
      setLoading(false);
    }
  }, [setDocument, setLoading, setError, setLabels, setPageNames, setRotation, setCurrentDocumentTitle]);

  // 폴더 생성
  const createFolder = useCallback(
    async (name: string): Promise<Folder> => {
      const folder = await apiCreateFolder(name, currentFolderId);
      addFolder(folder);
      return folder;
    },
    [addFolder, currentFolderId]
  );

  // 폴더 이름 변경
  const renameFolder = useCallback(
    async (id: string, name: string): Promise<Folder> => {
      const folder = await apiUpdateFolder(id, name);
      updateFolderInStore(id, { name });
      return folder;
    },
    [updateFolderInStore]
  );

  // 폴더 삭제
  const deleteFolder = useCallback(
    async (id: string) => {
      await apiDeleteFolder(id);
      removeFolderFromStore(id);
    },
    [removeFolderFromStore]
  );

  // 폴더로 이동 (네비게이션)
  const navigateToFolder = useCallback(
    (folderId: string | null) => {
      setCurrentFolderId(folderId);
    },
    [setCurrentFolderId]
  );

  // 문서를 폴더로 이동
  const moveDocumentToFolder = useCallback(
    async (documentId: string, folderId: string | null) => {
      await apiMoveDocumentToFolder(documentId, folderId);
      // 현재 폴더에서 문서 제거 (다른 폴더로 이동한 경우)
      if (folderId !== currentFolderId) {
        removeLibraryDocument(documentId);
      }
    },
    [currentFolderId, removeLibraryDocument]
  );

  // 상위 폴더로 이동
  const navigateUp = useCallback(() => {
    if (folderPath.length > 1) {
      // 현재 폴더의 부모로 이동
      setCurrentFolderId(folderPath[folderPath.length - 2]?.id || null);
    } else {
      // 루트로 이동
      setCurrentFolderId(null);
    }
  }, [folderPath, setCurrentFolderId]);

  return {
    documents: libraryDocuments,
    folders,
    currentFolderId,
    folderPath,
    isLibraryOpen,
    loadCurrentFolder,
    loadAllDocuments,
    uploadDocument,
    removeDocument,
    getDocUrl,
    openDocument,
    createFolder,
    renameFolder,
    deleteFolder,
    navigateToFolder,
    navigateUp,
    moveDocumentToFolder,
    toggleLibrary,
    setLibraryOpen,
  };
}
