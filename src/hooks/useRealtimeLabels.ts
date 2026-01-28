import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { getLabels } from '../api/labels';
import type { Label } from '../types/database.types';

export function useRealtimeLabels(documentId: string | null) {
  const { setLabels, addLabel, updateLabel, removeLabel } = useStore();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!documentId || documentId === 'local') return;

    // 이미 구독 중이면 스킵
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    // 실시간 구독 설정
    const channel = supabase
      .channel(`labels:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'labels',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLabel = payload.new as Label;
            addLabel(newLabel);
          } else if (payload.eventType === 'UPDATE') {
            const updatedLabel = payload.new as Label;
            updateLabel(updatedLabel.id, updatedLabel);
          } else if (payload.eventType === 'DELETE') {
            const deletedLabel = payload.old as { id: string };
            removeLabel(deletedLabel.id);
          }
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      subscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [documentId, addLabel, updateLabel, removeLabel]);

  // 문서 변경 시 라벨 다시 로드
  useEffect(() => {
    if (!documentId || documentId === 'local') return;

    async function loadLabels() {
      try {
        const labels = await getLabels(documentId!);
        setLabels(labels);
      } catch (error) {
        console.error('라벨 로드 실패:', error);
      }
    }

    loadLabels();
  }, [documentId, setLabels]);
}
