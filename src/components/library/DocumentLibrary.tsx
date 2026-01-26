import { useState, useRef } from 'react';
import { X, Upload, FolderOpen, Search } from 'lucide-react';
import { useStore } from '../../store';
import { useDocumentLibrary } from '../../hooks/useDocumentLibrary';
import { usePDF } from '../../hooks/usePDF';
import { DocumentCard } from './DocumentCard';
import { updateDocumentPageCount, updateDocumentLastOpened } from '../../api/documents';
import type { Document } from '../../types/database.types';

export function DocumentLibrary() {
  const { isLibraryOpen, setLibraryOpen } = useDocumentLibrary();
  const { documents, uploadDocument, removeDocument, getDocUrl } = useDocumentLibrary();
  const { loadDocument, documentId } = usePDF();
  const { setCurrentDocumentTitle } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLibraryOpen) return null;

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    setIsUploading(true);
    try {
      const title = file.name.replace(/\.pdf$/i, '');
      await uploadDocument(title, file);
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenDocument = async (doc: Document) => {
    try {
      // 최근 연 시간 업데이트
      await updateDocumentLastOpened(doc.id);

      const url = await getDocUrl(doc.file_path);
      await loadDocument(url, doc.id);
      setCurrentDocumentTitle(doc.title);

      // 페이지 수 업데이트 (처음 열 때)
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
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await removeDocument(id);
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('문서 삭제에 실패했습니다.');
    }
  };

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
          </div>
          <button
            onClick={() => setLibraryOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 및 업로드 */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="문서 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? '업로드 중...' : 'PDF 업로드'}
          </button>
        </div>

        {/* 문서 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '업로드된 문서가 없습니다.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  isActive={doc.id === documentId}
                  onOpen={handleOpenDocument}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t text-sm text-gray-500 text-center">
          총 {documents.length}개 문서
        </div>
      </div>
    </>
  );
}
