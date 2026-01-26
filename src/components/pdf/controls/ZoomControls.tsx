import { useZoom } from '../../../hooks/useZoom';
import { usePDF } from '../../../hooks/usePDF';
import { useStore } from '../../../store';
import { ZoomIn, ZoomOut, Maximize, Maximize2, RotateCw, RotateCcw } from 'lucide-react';
import { ZOOM_LEVELS } from '../../../types/pdf.types';

export function ZoomControls() {
  const { scale, setScale, zoomIn, zoomOut, fitToWidth, fitToPage } = useZoom();
  const { rotateClockwise, rotateCounterClockwise, rotation } = usePDF();
  const { containerWidth, containerHeight, pageOriginalWidth, pageOriginalHeight } = useStore();

  // 회전에 따른 실제 페이지 크기 (90도, 270도 회전 시 가로세로 교환)
  const isRotated = rotation === 90 || rotation === 270;
  const effectivePageWidth = isRotated ? pageOriginalHeight : pageOriginalWidth;
  const effectivePageHeight = isRotated ? pageOriginalWidth : pageOriginalHeight;

  const handleZoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'fit-width') {
      fitToWidth(containerWidth, effectivePageWidth);
    } else if (value === 'fit-screen') {
      fitToPage(containerWidth, containerHeight, effectivePageWidth, effectivePageHeight);
    } else {
      setScale(parseFloat(value));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={zoomOut}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="축소 (Ctrl+-)"
      >
        <ZoomOut className="w-5 h-5" />
      </button>

      <select
        value={scale}
        onChange={handleZoomChange}
        className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="fit-width">너비 맞춤</option>
        <option value="fit-screen">화면에 맞춤</option>
        <option disabled>──────</option>
        {ZOOM_LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>

      <button
        onClick={zoomIn}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="확대 (Ctrl++)"
      >
        <ZoomIn className="w-5 h-5" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        onClick={() => fitToWidth(containerWidth, effectivePageWidth)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="너비에 맞춤"
      >
        <Maximize2 className="w-5 h-5" />
      </button>

      <button
        onClick={() => fitToPage(containerWidth, containerHeight, effectivePageWidth, effectivePageHeight)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="화면에 맞춤"
      >
        <Maximize className="w-5 h-5" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        onClick={rotateCounterClockwise}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="반시계 방향 회전"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      <span className="text-xs text-gray-500 min-w-[2rem] text-center">
        {rotation}°
      </span>

      <button
        onClick={rotateClockwise}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="시계 방향 회전"
      >
        <RotateCw className="w-5 h-5" />
      </button>
    </div>
  );
}
