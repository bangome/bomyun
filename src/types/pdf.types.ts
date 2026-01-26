import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export interface PDFState {
  document: PDFDocumentProxy | null;
  documentId: string | null;
  numPages: number;
  isLoading: boolean;
  error: Error | null;
}

export interface ViewerState {
  currentPage: number;
  scale: number;
  rotation: number;
  viewMode: ViewMode;
  isSidebarOpen: boolean;
}

export type ViewMode = 'single' | 'continuous' | 'double';

export interface SearchMatch {
  pageIndex: number;
  matchIndex: number;
  text: string;
  position: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface SearchState {
  query: string;
  matches: SearchMatch[];
  currentMatchIndex: number;
  isSearching: boolean;
}

export interface PageRenderState {
  page: PDFPageProxy | null;
  isRendering: boolean;
  error: Error | null;
}

export interface ZoomLevel {
  value: number;
  label: string;
}

export const ZOOM_LEVELS: ZoomLevel[] = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
  { value: 2, label: '200%' },
  { value: 3, label: '300%' },
];

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 5;
export const SCALE_STEP = 0.25;
