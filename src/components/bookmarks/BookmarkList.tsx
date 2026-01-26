import { useCallback } from 'react';
import { Bookmark, BookmarkPlus, Trash2, GripVertical } from 'lucide-react';
import { useStore } from '../../store';
import { usePDF } from '../../hooks/usePDF';
import { deleteBookmark, toggleBookmark } from '../../api/bookmarks';
import type { Bookmark as BookmarkType } from '../../types/database.types';

export function BookmarkList() {
  const { documentId, goToPage, currentPage } = usePDF();
  const { bookmarks, addBookmark, removeBookmark, isPageBookmarked } = useStore();

  const isCurrentPageBookmarked = isPageBookmarked(currentPage);

  const handleToggleBookmark = useCallback(async () => {
    if (!documentId) return;

    try {
      const result = await toggleBookmark(documentId, currentPage, `페이지 ${currentPage}`);
      if (result.added && result.bookmark) {
        addBookmark(result.bookmark);
      } else {
        const existing = bookmarks.find((b) => b.page_number === currentPage);
        if (existing) {
          removeBookmark(existing.id);
        }
      }
    } catch (error) {
      console.error('북마크 토글 실패:', error);
    }
  }, [documentId, currentPage, addBookmark, removeBookmark, bookmarks]);

  const handleDeleteBookmark = useCallback(async (bookmarkId: string) => {
    try {
      await deleteBookmark(bookmarkId);
      removeBookmark(bookmarkId);
    } catch (error) {
      console.error('북마크 삭제 실패:', error);
    }
  }, [removeBookmark]);

  const handleBookmarkClick = useCallback((bookmark: BookmarkType) => {
    goToPage(bookmark.page_number);
  }, [goToPage]);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            북마크
          </h3>
          <button
            onClick={handleToggleBookmark}
            className={`p-2 rounded-lg transition-colors ${
              isCurrentPageBookmarked
                ? 'bg-primary-100 text-primary-600'
                : 'hover:bg-gray-100'
            }`}
            title={isCurrentPageBookmarked ? '북마크 제거' : '현재 페이지 북마크'}
          >
            {isCurrentPageBookmarked ? (
              <Bookmark className="w-5 h-5 fill-current" />
            ) : (
              <BookmarkPlus className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 북마크 목록 */}
      <div className="flex-1 overflow-y-auto">
        {bookmarks.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            북마크가 없습니다
          </div>
        ) : (
          <div className="divide-y">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer group flex items-center gap-2 ${
                  bookmark.page_number === currentPage ? 'bg-primary-50' : ''
                }`}
                onClick={() => handleBookmarkClick(bookmark)}
              >
                <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                <Bookmark
                  className={`w-4 h-4 flex-shrink-0 ${
                    bookmark.page_number === currentPage
                      ? 'text-primary-500 fill-current'
                      : 'text-gray-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {bookmark.title || `페이지 ${bookmark.page_number}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    페이지 {bookmark.page_number}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBookmark(bookmark.id);
                  }}
                  className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
