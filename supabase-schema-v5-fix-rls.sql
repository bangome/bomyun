-- =============================================
-- RLS 정책 수정 - 재귀 문제 해결
-- =============================================

-- 기존 user_profiles 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view same complex members" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- 새로운 user_profiles 정책 (재귀 없이)
-- SELECT: 본인 프로필만 조회 (같은 단지 멤버 조회는 별도 함수로 처리)
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- UPDATE: 본인 프로필만 수정
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT: 본인 프로필만 생성
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 같은 단지 멤버 목록을 가져오는 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION get_complex_members(target_complex_id UUID)
RETURNS TABLE (
  id UUID,
  display_name VARCHAR,
  role VARCHAR,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
AS $$
BEGIN
  -- 현재 사용자가 해당 단지에 속해있는지 확인
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.complex_id = target_complex_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    up.display_name,
    up.role,
    up.created_at
  FROM user_profiles up
  WHERE up.complex_id = target_complex_id;
END;
$$ LANGUAGE plpgsql;

-- 현재 사용자의 complex_id를 가져오는 함수 (다른 테이블에서 사용)
CREATE OR REPLACE FUNCTION get_user_complex_id()
RETURNS UUID
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (SELECT complex_id FROM user_profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql;

-- documents, labels, bookmarks의 RLS 정책도 함수 사용으로 변경
DROP POLICY IF EXISTS "Complex members can access documents" ON documents;
DROP POLICY IF EXISTS "Complex members can access labels" ON labels;
DROP POLICY IF EXISTS "Complex members can access bookmarks" ON bookmarks;

-- documents 정책 (함수 사용)
CREATE POLICY "Complex members can access documents" ON documents
  FOR ALL USING (complex_id = get_user_complex_id())
  WITH CHECK (complex_id = get_user_complex_id());

-- labels 정책 (함수 사용)
CREATE POLICY "Complex members can access labels" ON labels
  FOR ALL USING (complex_id = get_user_complex_id())
  WITH CHECK (complex_id = get_user_complex_id());

-- bookmarks 정책 (함수 사용)
CREATE POLICY "Complex members can access bookmarks" ON bookmarks
  FOR ALL USING (complex_id = get_user_complex_id())
  WITH CHECK (complex_id = get_user_complex_id());
