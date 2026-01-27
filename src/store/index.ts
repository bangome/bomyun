import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ViewMode, SearchMatch } from '../types/pdf.types';
import type { Label, Document, Folder, GlobalSearchResult, PageName } from '../types/database.types';

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
  isLabelAddMode: boolean;
  pendingLabelPosition: { pageNumber: number; x: number; y: number } | null;
  setLabels: (labels: Label[]) => void;
  addLabel: (label: Label) => void;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  removeLabel: (id: string) => void;
  setLabelFilter: (filter: string) => void;
  setLabelAddMode: (isAddMode: boolean) => void;
  setPendingLabelPosition: (data: { pageNumber: number; x: number; y: number } | null) => void;
}

interface DocumentLibrarySlice {
  libraryDocuments: Document[];
  isLibraryOpen: boolean;
  currentDocumentTitle: string | null;
  // 폴더 관련
  folders: Folder[];
  currentFolderId: string | null;
  folderPath: { id: string; name: string }[];
  setLibraryDocuments: (docs: Document[]) => void;
  addLibraryDocument: (doc: Document) => void;
  removeLibraryDocument: (id: string) => void;
  updateLibraryDocument: (id: string, updates: Partial<Document>) => void;
  toggleLibrary: () => void;
  setLibraryOpen: (open: boolean) => void;
  setCurrentDocumentTitle: (title: string | null) => void;
  // 폴더 관련
  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  removeFolder: (id: string) => void;
  setCurrentFolderId: (folderId: string | null) => void;
  setFolderPath: (path: { id: string; name: string }[]) => void;
}

interface GlobalSearchSlice {
  globalQuery: string;
  globalResults: GlobalSearchResult[];
  isGlobalSearching: boolean;
  setGlobalQuery: (q: string) => void;
  setGlobalResults: (r: GlobalSearchResult[]) => void;
  setGlobalSearching: (searching: boolean) => void;
  clearGlobalSearch: () => void;
}

interface PageNamesSlice {
  pageNames: PageName[];
  setPageNames: (pageNames: PageName[]) => void;
  addPageName: (pageName: PageName) => void;
  updatePageName: (id: string, updates: Partial<PageName>) => void;
  removePageName: (id: string) => void;
  getPageName: (pageNumber: number) => PageName | undefined;
}

type Store = PDFSlice & ViewerSlice & SearchSlice & LabelSlice & DocumentLibrarySlice & GlobalSearchSlice & PageNamesSlice;

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
            pageNames: [],
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
        isLabelAddMode: false,
        pendingLabelPosition: null,
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
        setLabelAddMode: (isAddMode) => set({ isLabelAddMode: isAddMode }),
        setPendingLabelPosition: (data) => set({ pendingLabelPosition: data }),

        // Document Library Slice
        libraryDocuments: [],
        isLibraryOpen: false,
        currentDocumentTitle: null,
        folders: [],
        currentFolderId: null,
        folderPath: [],
        setLibraryDocuments: (docs) => set({ libraryDocuments: docs }),
        addLibraryDocument: (doc) =>
          set((state) => ({ libraryDocuments: [doc, ...state.libraryDocuments] })),
        removeLibraryDocument: (id) =>
          set((state) => ({
            libraryDocuments: state.libraryDocuments.filter((d) => d.id !== id),
          })),
        updateLibraryDocument: (id, updates) =>
          set((state) => ({
            libraryDocuments: state.libraryDocuments.map((d) =>
              d.id === id ? { ...d, ...updates } : d
            ),
          })),
        toggleLibrary: () => set((state) => ({ isLibraryOpen: !state.isLibraryOpen })),
        setLibraryOpen: (open) => set({ isLibraryOpen: open }),
        setCurrentDocumentTitle: (title) => set({ currentDocumentTitle: title }),
        // 폴더 관련
        setFolders: (folders) => set({ folders }),
        addFolder: (folder) =>
          set((state) => ({ folders: [...state.folders, folder].sort((a, b) => a.name.localeCompare(b.name)) })),
        updateFolder: (id, updates) =>
          set((state) => ({
            folders: state.folders.map((f) =>
              f.id === id ? { ...f, ...updates } : f
            ),
          })),
        removeFolder: (id) =>
          set((state) => ({ folders: state.folders.filter((f) => f.id !== id) })),
        setCurrentFolderId: (folderId) => set({ currentFolderId: folderId }),
        setFolderPath: (path) => set({ folderPath: path }),

        // Global Search Slice
        globalQuery: '',
        globalResults: [],
        isGlobalSearching: false,
        setGlobalQuery: (q) => set({ globalQuery: q }),
        setGlobalResults: (r) => set({ globalResults: r }),
        setGlobalSearching: (searching) => set({ isGlobalSearching: searching }),
        clearGlobalSearch: () =>
          set({ globalQuery: '', globalResults: [], isGlobalSearching: false }),

        // Page Names Slice
        pageNames: [],
        setPageNames: (pageNames) => set({ pageNames }),
        addPageName: (pageName) =>
          set((state) => ({
            pageNames: [...state.pageNames.filter((p) => p.page_number !== pageName.page_number), pageName],
          })),
        updatePageName: (id, updates) =>
          set((state) => ({
            pageNames: state.pageNames.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          })),
        removePageName: (id) =>
          set((state) => ({ pageNames: state.pageNames.filter((p) => p.id !== id) })),
        getPageName: (pageNumber) => get().pageNames.find((p) => p.page_number === pageNumber),
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
