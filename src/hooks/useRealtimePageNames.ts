import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { getPageNames } from '../api/pageNames';
import type { PageName } from '../types/database.types';

export function useRealtimePageNames(documentId: string | null) {
  const { setPageNames, addPageName, updatePageName, removePageName } = useStore();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!documentId || documentId === 'local') return;

    // 이미 구독 중이면 스킵
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    console.log('[Realtime] 페이지 이름 구독 시작:', documentId);

    // 실시간 구독 설정
    const channel = supabase
      .channel(`page_names:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_names',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          console.log('[Realtime] 페이지 이름 변경 감지:', payload.eventType, payload);

          if (payload.eventType === 'INSERT') {
            const newPageName = payload.new as PageName;
            addPageName(newPageName);
          } else if (payload.eventType === 'UPDATE') {
            const updatedPageName = payload.new as PageName;
            updatePageName(updatedPageName.id, updatedPageName);
          } else if (payload.eventType === 'DELETE') {
            const deletedPageName = payload.old as { id: string };
            removePageName(deletedPageName.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] 페이지 이름 구독 상태:', status);
      });

    return () => {
      console.log('[Realtime] 페이지 이름 구독 해제:', documentId);
      subscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [documentId, addPageName, updatePageName, removePageName]);

  // 문서 변경 시 페이지 이름 다시 로드
  useEffect(() => {
    if (!documentId || documentId === 'local') return;

    async function loadPageNames() {
      try {
        const names = await getPageNames(documentId!);
        setPageNames(names);
      } catch (error) {
        console.error('페이지 이름 로드 실패:', error);
      }
    }

    loadPageNames();
  }, [documentId, setPageNames]);
}
