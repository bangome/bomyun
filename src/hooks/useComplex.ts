import { useComplexContext } from '../contexts/ComplexContext';

// useComplex는 이제 ComplexContext를 사용하는 래퍼입니다
export function useComplex() {
  return useComplexContext();
}
