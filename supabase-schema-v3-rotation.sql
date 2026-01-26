-- 문서 회전 정보 저장을 위한 스키마 업데이트
-- Supabase SQL Editor에서 실행하세요

-- documents 테이블에 rotation 컬럼 추가 (0, 90, 180, 270)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0;

-- rotation 값 제약 (0, 90, 180, 270만 허용)
ALTER TABLE documents ADD CONSTRAINT check_rotation
  CHECK (rotation IN (0, 90, 180, 270));
