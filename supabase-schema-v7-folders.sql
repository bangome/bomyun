-- =============================================
-- 폴더 시스템 스키마
-- =============================================

-- 1. 폴더 테이블 생성
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  complex_id UUID REFERENCES complexes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. documents 테이블에 folder_id 추가
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_complex_id ON folders(complex_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);

-- 4. RLS 활성화
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- 5. 폴더 RLS 정책
DROP POLICY IF EXISTS "Complex members can access folders" ON folders;

CREATE POLICY "Complex members can access folders" ON folders
  FOR ALL USING (
    complex_id IN (SELECT complex_id FROM user_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    complex_id IN (SELECT complex_id FROM user_profiles WHERE id = auth.uid())
  );

-- 6. 폴더 경로를 가져오는 재귀 함수
CREATE OR REPLACE FUNCTION get_folder_path(folder_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  depth INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_path AS (
    SELECT f.id, f.name, f.parent_id, 0 as depth
    FROM folders f
    WHERE f.id = folder_id

    UNION ALL

    SELECT f.id, f.name, f.parent_id, fp.depth + 1
    FROM folders f
    INNER JOIN folder_path fp ON f.id = fp.parent_id
  )
  SELECT fp.id, fp.name, fp.depth
  FROM folder_path fp
  ORDER BY fp.depth DESC;
END;
$$;

-- 7. 하위 폴더 ID 목록을 가져오는 함수 (삭제 시 사용)
CREATE OR REPLACE FUNCTION get_descendant_folder_ids(parent_folder_id UUID)
RETURNS TABLE (id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE descendants AS (
    SELECT f.id
    FROM folders f
    WHERE f.id = parent_folder_id

    UNION ALL

    SELECT f.id
    FROM folders f
    INNER JOIN descendants d ON f.parent_id = d.id
  )
  SELECT d.id FROM descendants d;
END;
$$;
