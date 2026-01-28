-- 관리자용 RLS 정책 추가
-- 관리자 이메일 확인 함수
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email = 'jinhwa@aegisep.com'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- user_profiles: 관리자는 모든 사용자 프로필 조회 가능
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
CREATE POLICY "Super admins can view all profiles" ON user_profiles
  FOR SELECT USING (is_super_admin());

-- complexes: 관리자는 모든 단지 조회 가능
DROP POLICY IF EXISTS "Super admins can view all complexes" ON complexes;
CREATE POLICY "Super admins can view all complexes" ON complexes
  FOR SELECT USING (is_super_admin());

-- documents: 관리자는 모든 문서 조회 가능
DROP POLICY IF EXISTS "Super admins can view all documents" ON documents;
CREATE POLICY "Super admins can view all documents" ON documents
  FOR SELECT USING (is_super_admin());

-- labels: 관리자는 모든 라벨 조회 가능
DROP POLICY IF EXISTS "Super admins can view all labels" ON labels;
CREATE POLICY "Super admins can view all labels" ON labels
  FOR SELECT USING (is_super_admin());

-- folders: 관리자는 모든 폴더 조회 가능
DROP POLICY IF EXISTS "Super admins can view all folders" ON folders;
CREATE POLICY "Super admins can view all folders" ON folders
  FOR SELECT USING (is_super_admin());

-- page_names: 관리자는 모든 페이지 이름 조회 가능
DROP POLICY IF EXISTS "Super admins can view all page_names" ON page_names;
CREATE POLICY "Super admins can view all page_names" ON page_names
  FOR SELECT USING (is_super_admin());
