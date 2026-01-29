import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as pdfjs from 'pdfjs-dist';
import { FileText, Loader2, AlertCircle, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Tag, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getSharedDocument } from '../api/sharedLinks';
import { useMousePan } from '../hooks/useMousePan';
import { usePinchZoom } from '../hooks/usePinchZoom';
import type { Document, Label, PageName } from '../types/database.types';

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const SCALE_STEP = 0.1;

// PDF.js Worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface SharedPageProps {
  pageNumber: number;
  pdfDocument: pdfjs.PDFDocumentProxy;
  scale: number;
  rotation: number;
  labels: Label[];
  pageName?: PageName;
}

function SharedPage({ pageNumber, pdfDocument, scale, rotation, labels, pageName }: SharedPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsRendering(true);

      try {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale, rotation });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setDimensions({ width: viewport.width, height: viewport.height });

        const ctx = canvas.getContext('2d');
        if (!ctx || cancelled) return;

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch (err) {
        console.error('페이지 렌더링 실패:', err);
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pageNumber, pdfDocument, scale, rotation]);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      className="relative bg-white shadow-lg mx-auto"
      style={{ width: dimensions.width || 'auto', height: dimensions.height || 'auto' }}
      data-page-number={pageNumber}
    >
      {/* 페이지 이름 */}
      {pageName && (
        <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {pageName.name}
        </div>
      )}

      {/* 로딩 */}
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}

      <canvas ref={canvasRef} className="block" />

      {/* 라벨 */}
      {labels.map((label) => (
        <div
          key={label.id}
          className="absolute flex items-center z-20 pointer-events-none"
          style={{
            left: `${label.position_x}%`,
            top: `${label.position_y}%`,
            transform: 'translateY(-50%)',
          }}
        >
          <div
            className="w-0 h-0 flex-shrink-0"
            style={{
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderRight: `10px solid ${hexToRgba(label.color, 0.6)}`,
            }}
          />
          <div
            className="px-2 py-1 text-white text-xs font-medium whitespace-nowrap max-w-48 truncate"
            style={{
              backgroundColor: hexToRgba(label.color, 0.6),
              borderTop: `1px solid ${label.color}`,
              borderRight: `1px solid ${label.color}`,
              borderBottom: `1px solid ${label.color}`,
            }}
            title={label.text}
          >
            {label.text}
          </div>
        </div>
      ))}

      {/* 페이지 번호 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {pageNumber}
      </div>
    </div>
  );
}

export function SharedViewer() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [pageNames, setPageNames] = useState<PageName[]>([]);
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 마우스 패닝
  const mousePanRef = useMousePan({ enabled: true });

  // 핀치 줌 (모바일)
  const pinchZoomRef = usePinchZoom({
    currentScale: scale,
    onZoomChange: setScale,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  });

  // ref 병합
  const setRefs = useCallback(
    (element: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = element;
      mousePanRef(element);
      pinchZoomRef(element);
    },
    [mousePanRef, pinchZoomRef]
  );

  // Ctrl + 휠 줌
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
        setScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s + delta)));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // 키보드 줌 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
        } else if (e.key === '-') {
          e.preventDefault();
          setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));
        } else if (e.key === '0') {
          e.preventDefault();
          setScale(1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    async function loadSharedDocument() {
      if (!shortCode) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getSharedDocument(shortCode);

        if (!result) {
          setError('공유 링크가 존재하지 않거나 만료되었습니다.');
          return;
        }

        setDocument(result.document);
        setLabels(result.labels);
        setPageNames(result.pageNames);

        // PDF 파일 URL 가져오기
        // 1. Public URL 시도 (버킷이 public일 경우)
        let pdfUrl: string | null = null;

        const { data: publicUrlData } = supabase.storage
          .from('pdfs')
          .getPublicUrl(result.document.file_path);

        if (publicUrlData?.publicUrl) {
          // Public URL로 접근 가능한지 확인
          try {
            const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              pdfUrl = publicUrlData.publicUrl;
            }
          } catch {
            // Public URL 실패, signed URL 시도
          }
        }

        // 2. Public URL 실패시 Signed URL 시도
        if (!pdfUrl) {
          const { data: signedUrlData } = await supabase.storage
            .from('pdfs')
            .createSignedUrl(result.document.file_path, 3600);

          if (signedUrlData?.signedUrl) {
            pdfUrl = signedUrlData.signedUrl;
          }
        }

        if (!pdfUrl) {
          throw new Error('PDF 파일을 불러올 수 없습니다. Storage 접근 권한을 확인하세요.');
        }

        // PDF 로드
        const loadingTask = pdfjs.getDocument({
          url: pdfUrl,
          cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
      } catch (err) {
        console.error('문서 로드 실패:', err);
        setError(err instanceof Error ? err.message : '문서를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadSharedDocument();
  }, [shortCode]);

  const numPages = pdfDocument?.numPages || 0;

  const pagesToRender = useMemo(() => {
    if (!pdfDocument) return [];
    return Array.from({ length: numPages }, (_, i) => i + 1);
  }, [pdfDocument, numPages]);

  const getLabelsForPage = useCallback(
    (pageNumber: number) => labels.filter((l) => l.page_number === pageNumber),
    [labels]
  );

  const getPageName = useCallback(
    (pageNumber: number) => pageNames.find((p) => p.page_number === pageNumber),
    [pageNames]
  );

  const handleZoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));
  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(numPages, p + 1));

  const handleLabelClick = (label: Label) => {
    setCurrentPage(label.page_number);
    // 해당 페이지로 스크롤
    const container = containerRef.current;
    if (container) {
      const pageEl = container.querySelector(`[data-page-number="${label.page_number}"]`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setIsSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
          <span className="text-gray-600">문서 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">문서를 열 수 없습니다</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* 헤더 */}
      <header className="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary-500" />
          <span className="font-medium text-gray-800 truncate max-w-[200px] sm:max-w-xs">
            {document?.title}
          </span>
        </div>

        <div className="flex-1" />

        {/* 줌 컨트롤 */}
        <div className="flex items-center gap-1">
          <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded-lg">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600 w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded-lg">
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* 페이지 네비게이션 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600 min-w-[80px] text-center">
            {currentPage} / {numPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 읽기 전용 배지 */}
        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
          읽기 전용
        </span>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 사이드바 - 라벨 목록 */}
        <aside
          className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:relative inset-y-0 left-0 z-40
            w-72 bg-white border-r flex flex-col
            transition-transform lg:transition-none
          `}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              라벨 ({labels.length})
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {labels.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                라벨이 없습니다
              </div>
            ) : (
              <div className="divide-y">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleLabelClick(label)}
                    className="w-full p-3 hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {label.text}
                        </p>
                        <p className="text-xs text-gray-500">
                          페이지 {label.page_number}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 오버레이 */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* PDF 뷰어 */}
        <main ref={setRefs} className="flex-1 overflow-auto p-4 space-y-4">
          {pdfDocument &&
            pagesToRender.map((pageNum) => (
              <SharedPage
                key={pageNum}
                pageNumber={pageNum}
                pdfDocument={pdfDocument}
                scale={scale}
                rotation={document?.rotation || 0}
                labels={getLabelsForPage(pageNum)}
                pageName={getPageName(pageNum)}
              />
            ))}
        </main>
      </div>
    </div>
  );
}
