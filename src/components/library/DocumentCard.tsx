import { FileText, Trash2, ExternalLink } from 'lucide-react';
import type { Document } from '../../types/database.types';

interface DocumentCardProps {
  document: Document;
  isActive?: boolean;
  onOpen: (doc: Document) => void;
  onDelete: (id: string) => void;
}

export function DocumentCard({ document, isActive, onOpen, onDelete }: DocumentCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`"${document.title}" 문서를 삭제하시겠습니까?`)) {
      onDelete(document.id);
    }
  };

  return (
    <div
      onClick={() => onOpen(document)}
      className={`
        group p-4 rounded-lg border cursor-pointer transition-all
        ${isActive
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg flex-shrink-0
          ${isActive ? 'bg-primary-100' : 'bg-gray-100 group-hover:bg-primary-100'}
        `}>
          <FileText className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate" title={document.title}>
            {document.title}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span>{formatDate(document.created_at)}</span>
            <span>{formatFileSize(document.file_size)}</span>
            {document.page_count && <span>{document.page_count}페이지</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(document);
            }}
            className="p-1.5 hover:bg-primary-100 rounded text-gray-400 hover:text-primary-600"
            title="열기"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
