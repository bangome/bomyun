-- Supabase Storage 정책 설정
-- Supabase SQL Editor에서 실행하세요

-- 1. pdfs 버킷이 없으면 생성 (대시보드에서 이미 생성했다면 생략)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

-- 3. 사용자별 폴더 접근 정책

-- 업로드: 인증된 사용자는 자신의 폴더(user_id/)에만 업로드 가능
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 읽기: 인증된 사용자는 자신의 폴더 파일만 읽기 가능
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 삭제: 인증된 사용자는 자신의 폴더 파일만 삭제 가능
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 수정: 인증된 사용자는 자신의 폴더 파일만 수정 가능
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 참고: 파일 경로 구조
-- pdfs/{user_id}/{filename}.pdf
-- 예: pdfs/123e4567-e89b-12d3-a456-426614174000/1234567890.pdf
