import { useState } from 'react';
import { Folder as FolderIcon, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { Folder } from '../../types/database.types';

interface FolderCardProps {
  folder: Folder;
  onOpen: (folder: Folder) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDrop: (folderId: string, e: React.DragEvent) => void;
}

export function FolderCard({ folder, onOpen, onRename, onDelete, onDrop }: FolderCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleRename = () => {
    if (editName.trim() && editName !== folder.name) {
      onRename(folder.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(folder.name);
      setIsEditing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDrop(folder.id, e);
  };

  const isHighlighted = isDragOver;

  return (
    <div
      data-folder-id={folder.id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isEditing && onOpen(folder)}
      className={`
        group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
        ${isHighlighted
          ? 'border-primary-500 bg-primary-100 ring-2 ring-primary-300'
          : 'bg-amber-50 border-amber-200 hover:border-amber-400'
        }
      `}
    >
      <FolderIcon className={`w-8 h-8 flex-shrink-0 ${isHighlighted ? 'text-primary-500' : 'text-amber-500'}`} />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            autoFocus
          />
        ) : (
          <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
        )}
      </div>

      {/* 메뉴 버튼 */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="p-1 hover:bg-amber-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
              }}
            />
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  setIsEditing(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit2 className="w-4 h-4" />
                이름 변경
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  if (confirm('폴더와 하위 내용을 모두 삭제하시겠습니까?')) {
                    onDelete(folder.id);
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
