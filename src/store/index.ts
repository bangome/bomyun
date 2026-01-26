import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ViewMode, SearchMatch } from '../types/pdf.types';
import type { Label, Bookmark, Document, GlobalLabelSearchResult } from '../types/database.types';

interface PDFSlice {
  document: PDFDocumentProxy | null;
  documentId: string | null;
  documentUrl: string | null;
  numPages: number;
  isLoading: boolean;
  error: Error | null;
  setDocument: (doc: PDFDocumentProxy | null, id: string | null, url: string | null) => void;
  setNumPages: (numPages: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  resetDocument: () => void;
}

interface ViewerSlice {
  currentPage: number;
  scale: number;
  rotation: number;
  viewMode: ViewMode;
  isSidebarOpen: boolean;
  // 페이지/컨테이너 크기 (fitToWidth, fitToPage용)
  pageOriginalWidth: number;
  pageOriginalHeight: number;
  containerWidth: number;
  containerHeight: number;
  setCurrentPage: (page: number) => void;
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setRotation: (rotation: number) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  setPageOriginalSize: (width: number, height: number) => void;
  setContainerSize: (width: number, height: number) => void;
}

interface SearchSlice {
  query: string;
  matches: SearchMatch[];
  currentMatchIndex: number;
  isSearching: boolean;
  setQuery: (query: string) => void;
  setMatches: (matches: SearchMatch[]) => void;
  setCurrentMatchIndex: (index: number) => void;
  nextMatch: () => void;
  prevMatch: () => void;
  setSearching: (isSearching: boolean) => void;
  clearSearch: () => void;
}

interface LabelSlice {
  labels: Label[];
  labelFilter: string;
  setLabels: (labels: Label[]) => void;
  addLabel: (label: Label) => void;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  removeLabel: (id: string) => void;
  setLabelFilter: (filter: string) => void;
}

interface BookmarkSlice {
  bookmarks: Bookmark[];
  setBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;
  isPageBookmarked: (pageNumber: number) => boolean;
}

interface DocumentLibrarySlice {
  libraryDocuments: Document[];
  isLibraryOpen: boolean;
  currentDocumentTitle: string | null;
  setLibraryDocuments: (docs: Document[]) => void;
  addLibraryDocument: (doc: Document) => void;
  removeLibraryDocument: (id: string) => void;
  toggleLibrary: () => void;
  setLibraryOpen: (open: boolean) => void;
  setCurrentDocumentTitle: (title: string | null) => void;
}

interface GlobalSearchSlice {
  globalQuery: string;
  globalResults: GlobalLabelSearchResult[];
  isGlobalSearching: boolean;
  setGlobalQuery: (q: string) => void;
  setGlobalResults: (r: GlobalLabelSearchResult[]) => void;
  setGlobalSearching: (searching: boolean) => void;
  clearGlobalSearch: () => void;
}

type Store = PDFSlice & ViewerSlice & SearchSlice & LabelSlice & BookmarkSlice & DocumentLibrarySlice & GlobalSearchSlice;

export const useStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({
        // PDF Slice
        document: null,
        documentId: null,
        documentUrl: null,
        numPages: 0,
        isLoading: false,
        error: null,
        setDocument: (doc, id, url) =>
          set({
            document: doc,
            documentId: id,
            documentUrl: url,
            numPages: doc?.numPages ?? 0,
            error: null,
          }),
        setNumPages: (numPages) => set({ numPages }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error, isLoading: false }),
        resetDocument: () =>
          set({
            document: null,
            documentId: null,
            documentUrl: null,
            numPages: 0,
            error: null,
            currentPage: 1,
            labels: [],
            bookmarks: [],
          }),

        // Viewer Slice
        currentPage: 1,
        scale: 1,
        rotation: 0,
        viewMode: 'continuous',
        isSidebarOpen: true,
        pageOriginalWidth: 0,
        pageOriginalHeight: 0,
        containerWidth: 0,
        containerHeight: 0,
        setCurrentPage: (page) => {
          const maxPage = get().numPages || 1;
          set({ currentPage: Math.max(1, Math.min(page, maxPage)) });
        },
        setScale: (scale) => set({ scale: Math.max(0.25, Math.min(5, scale)) }),
        zoomIn: () => set((state) => ({ scale: Math.min(5, state.scale + 0.25) })),
        zoomOut: () => set((state) => ({ scale: Math.max(0.25, state.scale - 0.25) })),
        setRotation: (rotation) => set({ rotation: rotation % 360 }),
        setViewMode: (mode) => set({ viewMode: mode }),
        toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setPageOriginalSize: (width, height) => set({ pageOriginalWidth: width, pageOriginalHeight: height }),
        setContainerSize: (width, height) => set({ containerWidth: width, containerHeight: height }),

        // Search Slice
        query: '',
        matches: [],
        currentMatchIndex: -1,
        isSearching: false,
        setQuery: (query) => set({ query }),
        setMatches: (matches) =>
          set({ matches, currentMatchIndex: matches.length > 0 ? 0 : -1 }),
        setCurrentMatchIndex: (index) => set({ currentMatchIndex: index }),
        nextMatch: () =>
          set((state) => {
            if (state.matches.length === 0) return state;
            return {
              currentMatchIndex: (state.currentMatchIndex + 1) % state.matches.length,
            };
          }),
        prevMatch: () =>
          set((state) => {
            if (state.matches.length === 0) return state;
            return {
              currentMatchIndex:
                (state.currentMatchIndex - 1 + state.matches.length) %
                state.matches.length,
            };
          }),
        setSearching: (isSearching) => set({ isSearching }),
        clearSearch: () =>
          set({ query: '', matches: [], currentMatchIndex: -1, isSearching: false }),

        // Label Slice
        labels: [],
        labelFilter: '',
        setLabels: (labels) => set({ labels }),
        addLabel: (label) => set((state) => ({ labels: [...state.labels, label] })),
        updateLabel: (id, updates) =>
          set((state) => ({
            labels: state.labels.map((l) =>
              l.id === id ? { ...l, ...updates } : l
            ),
          })),
        removeLabel: (id) =>
          set((state) => ({ labels: state.labels.filter((l) => l.id !== id) })),
        setLabelFilter: (filter) => set({ labelFilter: filter }),

        // Bookmark Slice
        bookmarks: [],
        setBookmarks: (bookmarks) => set({ bookmarks }),
        addBookmark: (bookmark) =>
          set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
        removeBookmark: (id) =>
          set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) })),
        isPageBookmarked: (pageNumber) => {
          return get().bookmarks.some((b) => b.page_number === pageNumber);
        },

        // Document Library Slice
        libraryDocuments: [],
        isLibraryOpen: false,
        currentDocumentTitle: null,
        setLibraryDocuments: (docs) => set({ libraryDocuments: docs }),
        addLibraryDocument: (doc) =>
          set((state) => ({ libraryDocuments: [doc, ...state.libraryDocuments] })),
        removeLibraryDocument: (id) =>
          set((state) => ({
            libraryDocuments: state.libraryDocuments.filter((d) => d.id !== id),
          })),
        toggleLibrary: () => set((state) => ({ isLibraryOpen: !state.isLibraryOpen })),
        setLibraryOpen: (open) => set({ isLibraryOpen: open }),
        setCurrentDocumentTitle: (title) => set({ currentDocumentTitle: title }),

        // Global Search Slice
        globalQuery: '',
        globalResults: [],
        isGlobalSearching: false,
        setGlobalQuery: (q) => set({ globalQuery: q }),
        setGlobalResults: (r) => set({ globalResults: r }),
        setGlobalSearching: (searching) => set({ isGlobalSearching: searching }),
        clearGlobalSearch: () =>
          set({ globalQuery: '', globalResults: [], isGlobalSearching: false }),
      }),
      {
        name: 'pdf-viewer-storage',
        partialize: (state) => ({
          scale: state.scale,
          viewMode: state.viewMode,
          isSidebarOpen: state.isSidebarOpen,
        }),
      }
    )
  )
);
