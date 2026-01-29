-- 공유 링크를 통한 PDF 파일 접근 허용
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 storage 정책 확인 (필요시)
-- SELECT * FROM storage.policies WHERE bucket_id = 'pdfs';

-- 2. 공유 링크가 있는 문서의 파일에 대해 비인증 접근 허용
CREATE POLICY "Allow public access to shared pdfs"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'pdfs' AND
  EXISTS (
    SELECT 1 FROM public.shared_links sl
    JOIN public.documents d ON sl.document_id = d.id
    WHERE d.file_path = storage.objects.name
    AND (sl.expires_at IS NULL OR sl.expires_at > now())
  )
);

-- 참고: 위 정책이 동작하지 않으면, 아래 간단한 정책을 대신 사용하세요
-- (보안이 낮아지지만 모든 pdfs 버킷 파일에 접근 가능)
--
-- CREATE POLICY "Allow public read access to pdfs"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'pdfs');
