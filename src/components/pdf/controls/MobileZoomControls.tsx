import { useZoom } from '../../../hooks/useZoom';
import { usePDF } from '../../../hooks/usePDF';
import { useStore } from '../../../store';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export function MobileZoomControls() {
  const { scale, zoomIn, zoomOut, fitToWidth } = useZoom();
  const { rotateClockwise } = usePDF();
  const { containerWidth, pageOriginalWidth, pageOriginalHeight } = useStore();
  const { rotation } = usePDF();

  const isRotated = rotation === 90 || rotation === 270;
  const effectivePageWidth = isRotated ? pageOriginalHeight : pageOriginalWidth;

  const zoomPercent = Math.round(scale * 100);

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={zoomOut}
        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        title="축소"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        onClick={() => fitToWidth(containerWidth, effectivePageWidth)}
        className="px-1.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded min-w-[3rem]"
      >
        {zoomPercent}%
      </button>

      <button
        onClick={zoomIn}
        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        title="확대"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-0.5" />

      <button
        onClick={rotateClockwise}
        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        title="회전"
      >
        <RotateCw className="w-4 h-4" />
      </button>
    </div>
  );
}
