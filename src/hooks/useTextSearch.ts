import { useCallback } from 'react';
import { useStore } from '../store';
import type { SearchMatch } from '../types/pdf.types';

export function useTextSearch() {
  const {
    document,
    query,
    matches,
    currentMatchIndex,
    isSearching,
    setQuery,
    setMatches,
    setCurrentMatchIndex,
    setSearching,
    clearSearch,
    setCurrentPage,
  } = useStore();

  const search = useCallback(
    async (searchQuery: string) => {
      if (!document || !searchQuery.trim()) {
        clearSearch();
        return;
      }

      setQuery(searchQuery);
      setSearching(true);

      try {
        const allMatches: SearchMatch[] = [];
        const normalizedQuery = searchQuery.toLowerCase();

        for (let pageNum = 1; pageNum <= document.numPages; pageNum++) {
          const page = await document.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1 });

          // 페이지의 모든 텍스트 아이템을 위치 정보와 함께 수집
          const textItems: Array<{
            str: string;
            transform: number[];
            width: number;
            height: number;
            x: number;
            y: number;
            fontSize: number;
          }> = [];

          for (const item of textContent.items) {
            if ('str' in item && item.str) {
              const textItem = item as any;
              const transform = textItem.transform;

              // 폰트 크기 계산 (transform 매트릭스에서)
              const fontSize = Math.sqrt(transform[0] ** 2 + transform[1] ** 2);

              // 텍스트 너비: 없거나 0이면 0으로 설정 (하이라이트 안함)
              const textWidth = textItem.width && textItem.width > 0 ? textItem.width : 0;

              // 텍스트 높이
              const textHeight = textItem.height || fontSize;

              textItems.push({
                str: textItem.str,
                transform,
                width: textWidth,
                height: textHeight,
                x: transform[4],
                y: transform[5],
                fontSize,
              });
            }
          }

          // 각 텍스트 아이템에서 검색
          let matchIndex = 0;
          for (const textItem of textItems) {
            const text = textItem.str;
            const lowerText = text.toLowerCase();

            let pos = 0;
            while ((pos = lowerText.indexOf(normalizedQuery, pos)) !== -1) {
              // 문자 너비 계산
              const charWidth = text.length > 0 ? textItem.width / text.length : textItem.fontSize * 0.5;

              // 매치 시작 위치의 x 오프셋
              const matchStartX = textItem.x + pos * charWidth;
              const matchWidth = searchQuery.length * charWidth;

              // PDF 좌표계 (좌하단 원점)를 화면 좌표계 (좌상단 원점)로 변환
              const left = (matchStartX / viewport.width) * 100;
              const top = ((viewport.height - textItem.y - textItem.fontSize) / viewport.height) * 100;
              const width = (matchWidth / viewport.width) * 100;
              const height = ((textItem.fontSize * 1.2) / viewport.height) * 100;

              // 매치 추가 (width가 0이면 하이라이트 없이 페이지 이동만 가능)
              allMatches.push({
                pageIndex: pageNum - 1,
                matchIndex: matchIndex++,
                text: text.substring(pos, pos + searchQuery.length),
                position: { left, top, width, height },
              });

              pos += normalizedQuery.length;
            }
          }
        }

        setMatches(allMatches);
      } catch (error) {
        console.error('검색 중 오류:', error);
        setMatches([]);
      } finally {
        setSearching(false);
      }
    },
    [document, setQuery, setMatches, setSearching, clearSearch]
  );

  const goToMatch = useCallback(
    (index: number) => {
      if (index >= 0 && index < matches.length) {
        setCurrentMatchIndex(index);
        const match = matches[index];
        setCurrentPage(match.pageIndex + 1);
      }
    },
    [matches, setCurrentMatchIndex, setCurrentPage]
  );

  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;

    const nextIndex = (currentMatchIndex + 1) % matches.length;
    goToMatch(nextIndex);
  }, [matches.length, currentMatchIndex, goToMatch]);

  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;

    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    goToMatch(prevIndex);
  }, [matches.length, currentMatchIndex, goToMatch]);

  const getCurrentMatch = useCallback(() => {
    if (currentMatchIndex >= 0 && currentMatchIndex < matches.length) {
      return matches[currentMatchIndex];
    }
    return null;
  }, [matches, currentMatchIndex]);

  const getMatchesForPage = useCallback(
    (pageIndex: number) => {
      return matches.filter((m) => m.pageIndex === pageIndex);
    },
    [matches]
  );

  return {
    query,
    matches,
    currentMatchIndex,
    totalMatches: matches.length,
    isSearching,
    currentMatch: getCurrentMatch(),
    search,
    goToMatch,
    goToNextMatch,
    goToPrevMatch,
    getMatchesForPage,
    clearSearch,
  };
}
