-- 라벨 테이블에 위치 정보 추가
ALTER TABLE labels ADD COLUMN IF NOT EXISTS position_x REAL DEFAULT 95;
ALTER TABLE labels ADD COLUMN IF NOT EXISTS position_y REAL DEFAULT 10;

-- 기존 라벨들의 기본 위치 설정 (오른쪽 상단)
UPDATE labels SET position_x = 95, position_y = 10 WHERE position_x IS NULL;

-- NOT NULL 제약조건 추가
ALTER TABLE labels ALTER COLUMN position_x SET NOT NULL;
ALTER TABLE labels ALTER COLUMN position_y SET NOT NULL;
ALTER TABLE labels ALTER COLUMN position_x SET DEFAULT 95;
ALTER TABLE labels ALTER COLUMN position_y SET DEFAULT 10;
