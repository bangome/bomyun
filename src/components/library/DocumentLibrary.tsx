import { useState, useRef, useCallback } from 'react';
import { X, Upload, FolderOpen, Search, FolderPlus, ChevronRight, Home, ArrowUp } from 'lucide-react';
import { useStore } from '../../store';
import { useDocumentLibrary } from '../../hooks/useDocumentLibrary';
import { usePDF } from '../../hooks/usePDF';
import { DocumentCard } from './DocumentCard';
import { FolderCard } from './FolderCard';
import { updateDocumentPageCount, updateDocumentLastOpened } from '../../api/documents';
import type { Document, Folder } from '../../types/database.types';

export function DocumentLibrary() {
  const { isLibraryOpen, setLibraryOpen } = useDocumentLibrary();
  const {
    documents,
    folders,
    currentFolderId,
    folderPath,
    uploadDocument,
    removeDocument,
    getDocUrl,
    createFolder,
    renameFolder,
    deleteFolder,
    navigateToFolder,
    moveDocumentToFolder,
    loadCurrentFolder,
  } = useDocumentLibrary();
  const { loadDocument, documentId } = usePDF();
  const { setCurrentDocumentTitle } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // 선택 관련 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [isDragOverParent, setIsDragOverParent] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 필터링된 데이터 (useMemo 대신 일반 변수로 처리)
  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 문서 선택 핸들러
  const handleSelectDocument = useCallback((doc: Document, e: React.MouseEvent) => {
    const docIndex = filteredDocuments.findIndex(d => d.id === doc.id);

    if (e.ctrlKey || e.metaKey) {
      // Ctrl+클릭: 토글 선택
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(doc.id)) {
          newSet.delete(doc.id);
        } else {
          newSet.add(doc.id);
        }
        return newSet;
      });
      setLastSelectedId(doc.id);
    } else if (e.shiftKey && lastSelectedId) {
      // Shift+클릭: 범위 선택
      const lastIndex = filteredDocuments.findIndex(d => d.id === lastSelectedId);
      if (lastIndex !== -1 && docIndex !== -1) {
        const start = Math.min(lastIndex, docIndex);
        const end = Math.max(lastIndex, docIndex);
        const rangeIds = filteredDocuments.slice(start, end + 1).map(d => d.id);
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          rangeIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    } else {
      // 일반 클릭: 단일 선택
      setSelectedIds(new Set([doc.id]));
      setLastSelectedId(doc.id);
    }
  }, [filteredDocuments, lastSelectedId]);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.DragEvent, doc: Document) => {
    // 선택된 문서가 있으면 선택된 것들 모두, 없으면 현재 문서만
    let docIds: string[];
    if (selectedIds.has(doc.id)) {
      docIds = Array.from(selectedIds);
    } else {
      docIds = [doc.id];
      setSelectedIds(new Set([doc.id]));
    }

    e.dataTransfer.setData('text/plain', docIds.join(','));
    e.dataTransfer.effectAllowed = 'move';

    // 드래그 이미지 설정
    const dragImage = document.createElement('div');
    dragImage.className = 'bg-primary-500 text-white px-3 py-2 rounded-lg shadow-lg';
    dragImage.textContent = docIds.length > 1 ? `${docIds.length}개 파일` : doc.title;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, [selectedIds]);

  // 폴더에 드롭
  const handleDropToFolder = useCallback(async (folderId: string, e: React.DragEvent) => {
    // 드래그 이벤트에서 직접 문서 ID 읽기
    const docIdsStr = e.dataTransfer.getData('text/plain');
    const docIds = docIdsStr.split(',').filter(Boolean);

    if (docIds.length === 0) return;

    try {
      for (const docId of docIds) {
        await moveDocumentToFolder(docId, folderId);
      }
      setSelectedIds(new Set());
      loadCurrentFolder();
    } catch (error) {
      console.error('이동 실패:', error);
      alert('문서 이동에 실패했습니다.');
    }
  }, [moveDocumentToFolder, loadCurrentFolder]);

  // 상위 폴더로 드롭
  const handleDropToParent = useCallback(async (e: React.DragEvent) => {
    // 드래그 이벤트에서 직접 문서 ID 읽기
    const docIdsStr = e.dataTransfer.getData('text/plain');
    const docIds = docIdsStr.split(',').filter(Boolean);

    if (docIds.length === 0) return;

    // 현재 폴더의 부모 폴더 ID 찾기
    const parentFolderId = folderPath.length > 1
      ? folderPath[folderPath.length - 2].id
      : null;

    try {
      for (const docId of docIds) {
        await moveDocumentToFolder(docId, parentFolderId);
      }
      setSelectedIds(new Set());
      loadCurrentFolder();
    } catch (error) {
      console.error('이동 실패:', error);
      alert('문서 이동에 실패했습니다.');
    }
  }, [folderPath, moveDocumentToFolder, loadCurrentFolder]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const pdfFiles = Array.from(files).filter(
      (file) => file.type === 'application/pdf'
    );

    if (pdfFiles.length === 0) {
      alert('PDF 파일만 업로드할 수 있습니다.');
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
    }

    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadDocument]);

  const handleOpenDocument = useCallback(async (doc: Document) => {
    try {
      await updateDocumentLastOpened(doc.id);

      const url = await getDocUrl(doc.file_path);
      await loadDocument(url, doc.id);
      setCurrentDocumentTitle(doc.title);

      if (!doc.page_count) {
        const store = useStore.getState();
        if (store.numPages > 0) {
          await updateDocumentPageCount(doc.id, store.numPages);
        }
      }

      setLibraryOpen(false);
    } catch (error) {
      console.error('문서 열기 실패:', error);
      alert('문서를 열 수 없습니다.');
    }
  }, [getDocUrl, loadDocument, setCurrentDocumentTitle, setLibraryOpen]);

  const handleDeleteDocument = useCallback(async (id: string) => {
    try {
      await removeDocument(id);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('문서 삭제에 실패했습니다.');
    }
  }, [removeDocument]);

  const handleOpenFolder = useCallback((folder: Folder) => {
    setSelectedIds(new Set());
    navigateToFolder(folder.id);
  }, [navigateToFolder]);

  const handleRenameFolder = useCallback(async (id: string, name: string) => {
    try {
      await renameFolder(id, name);
    } catch (error) {
      console.error('이름 변경 실패:', error);
      alert('폴더 이름 변경에 실패했습니다.');
    }
  }, [renameFolder]);

  const handleDeleteFolder = useCallback(async (id: string) => {
    try {
      await deleteFolder(id);
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('폴더 삭제에 실패했습니다.');
    }
  }, [deleteFolder]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('폴더 생성 실패:', error);
      alert('폴더 생성에 실패했습니다.');
    }
  }, [newFolderName, createFolder]);

  // 빈 공간 클릭 시 선택 해제
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedIds(new Set());
    }
  }, []);

  // Early return은 모든 훅 정의 후에 위치
  if (!isLibraryOpen) return null;

  return (
    <>
      {/* 오버레이 배경 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setLibraryOpen(false)}
      />

      {/* 라이브러리 패널 */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold">문서 라이브러리</h2>
            {selectedIds.size > 0 && (
              <span className="text-sm text-primary-600 bg-primary-100 px-2 py-0.5 rounded">
                {selectedIds.size}개 선택
              </span>
            )}
          </div>
          <button
            onClick={() => setLibraryOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 브레드크럼 네비게이션 */}
        <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-1 text-sm overflow-x-auto">
          <button
            onClick={() => {
              setSelectedIds(new Set());
              navigateToFolder(null);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 ${
              currentFolderId === null ? 'text-primary-600 font-medium' : 'text-gray-600'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>홈</span>
          </button>
          {folderPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => {
                  setSelectedIds(new Set());
                  navigateToFolder(folder.id);
                }}
                className={`px-2 py-1 rounded hover:bg-gray-200 truncate max-w-32 ${
                  index === folderPath.length - 1
                    ? 'text-primary-600 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>

        {/* 검색 및 업로드 */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="문서/폴더 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-4 h-4" />
              {isUploading
                ? `업로드 중... (${uploadProgress.current}/${uploadProgress.total})`
                : 'PDF 업로드'}
            </button>
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="새 폴더"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {/* 새 폴더 생성 */}
          {isCreatingFolder && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="폴더 이름"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                생성
              </button>
              <button
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          )}
        </div>

        {/* 폴더 및 문서 목록 */}
        <div
          className="flex-1 overflow-y-auto p-4"
          onClick={handleBackgroundClick}
        >
          {filteredFolders.length === 0 && filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '폴더나 문서가 없습니다.'}
            </div>
          ) : (
            <div className="space-y-3">
              {/* 상위 폴더로 이동 (클릭 및 드롭 타겟) */}
              {currentFolderId && (
                <div
                  onClick={() => {
                    setSelectedIds(new Set());
                    // 상위 폴더로 이동: folderPath에서 마지막 이전 항목, 없으면 루트(null)
                    const parentFolderId = folderPath.length > 1
                      ? folderPath[folderPath.length - 2].id
                      : null;
                    navigateToFolder(parentFolderId);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverParent(true);
                  }}
                  onDragLeave={() => setIsDragOverParent(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverParent(false);
                    handleDropToParent(e);
                  }}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border border-dashed cursor-pointer transition-all
                    ${isDragOverParent
                      ? 'border-primary-500 bg-primary-100'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <ArrowUp className={`w-5 h-5 ${isDragOverParent ? 'text-primary-500' : 'text-gray-400'}`} />
                  <span className={`text-sm ${isDragOverParent ? 'text-primary-600' : 'text-gray-500'}`}>
                    상위 폴더로 이동
                  </span>
                </div>
              )}

              {/* 폴더 목록 */}
              {filteredFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onOpen={handleOpenFolder}
                  onRename={handleRenameFolder}
                  onDelete={handleDeleteFolder}
                  onDrop={handleDropToFolder}
                />
              ))}

              {/* 구분선 */}
              {filteredFolders.length > 0 && filteredDocuments.length > 0 && (
                <div className="border-t border-gray-200 my-2" />
              )}

              {/* 문서 목록 */}
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  isActive={doc.id === documentId}
                  isSelected={selectedIds.has(doc.id)}
                  onSelect={handleSelectDocument}
                  onOpen={handleOpenDocument}
                  onDelete={handleDeleteDocument}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t text-sm text-gray-500 text-center">
          {folders.length}개 폴더, {documents.length}개 문서
          {selectedIds.size > 0 && (
            <span className="ml-2 text-primary-600">• {selectedIds.size}개 선택됨</span>
          )}
        </div>
      </div>
    </>
  );
}
