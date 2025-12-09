import React, { useState, useRef, useEffect } from 'react';
import { X, Wand2, Eraser, Check, Undo, RotateCcw, Redo, ZoomIn, ZoomOut, Search } from 'lucide-react';
import { ImageItem, Language } from '../types';
import { removeBackground, enhanceImage } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';

interface EditorModalProps {
  item: ImageItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedItem: ImageItem) => void;
  language: Language;
}

const EditorModal: React.FC<EditorModalProps> = ({ item, isOpen, onClose, onUpdate, language }) => {
  const t = TRANSLATIONS[language];
  
  // History State: Array of base64/url strings
  const [history, setHistory] = useState<string[]>([]);
  // Pointer to the current state in the history array
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [crop, setCrop] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  
  // Zoom State
  const [zoom, setZoom] = useState(1);
  
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      setHistory([item.url]);
      setCurrentIndex(0);
      setCrop(null);
      setIsSelecting(false);
      setZoom(1);
    }
  }, [item, isOpen]);

  // Derived state for the image being displayed
  const currentImage = history[currentIndex] || item.url;

  if (!isOpen) return null;

  const pushToHistory = (newUrl: string) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newUrl);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCrop(null);
    }
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCrop(null);
    }
  };

  const handleReset = () => {
    if (history.length > 0) {
      // Revert to the original image (index 0)
      setCurrentIndex(0);
      setCrop(null);
      setZoom(1);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));
  const handleZoomReset = () => setZoom(1);

  const handleAiAction = async (action: 'bg' | 'enhance') => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      let newUrl = '';
      if (action === 'bg') {
        newUrl = await removeBackground(currentImage);
      } else {
        newUrl = await enhanceImage(currentImage);
      }
      pushToHistory(newUrl);
      setCrop(null); 
    } catch (e) {
      alert("AI processing failed. Please check your API key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    onUpdate({ ...item, url: currentImage });
    onClose();
  };

  // --- Robust Crop Logic ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current || isProcessing) return;
    e.preventDefault(); 
    e.stopPropagation();
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setCrop({ x, y, w: 0, h: 0 });
    setIsSelecting(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !startPos || !imageRef.current || isProcessing) return;
    e.preventDefault();

    const rect = imageRef.current.getBoundingClientRect();
    
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Constrain within the visual (zoomed) dimensions
    const currentX = Math.max(0, Math.min(rawX, rect.width));
    const currentY = Math.max(0, Math.min(rawY, rect.height));

    const w = currentX - startPos.x;
    const h = currentY - startPos.y;

    setCrop({
      x: startPos.x,
      y: startPos.y,
      w, 
      h
    });
  };

  const applyCrop = () => {
    if (!crop || !imageRef.current) return;
    
    const finalX = crop.w < 0 ? crop.x + crop.w : crop.x;
    const finalY = crop.h < 0 ? crop.y + crop.h : crop.y;
    const finalW = Math.abs(crop.w);
    const finalH = Math.abs(crop.h);

    if (finalW < 10 || finalH < 10) {
      setCrop(null);
      return;
    }

    const canvas = document.createElement('canvas');
    
    // Important: rect.width includes the zoom scale. 
    // We compare natural dimensions to visual dimensions to get the correct crop ratio.
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    
    canvas.width = finalW * scaleX;
    canvas.height = finalH * scaleY;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(
        imageRef.current,
        finalX * scaleX,
        finalY * scaleY,
        finalW * scaleX,
        finalH * scaleY,
        0,
        0,
        finalW * scaleX,
        finalH * scaleY
      );
      pushToHistory(canvas.toDataURL());
    }
    setCrop(null);
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      setIsSelecting(false);
      
      if (crop && Math.abs(crop.w) > 10 && Math.abs(crop.h) > 10) {
        applyCrop();
      } else {
        setCrop(null);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-default"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-white dark:bg-gray-900 w-[90vw] h-[90vh] rounded-lg flex flex-col border border-gray-300 dark:border-gray-700 shadow-2xl transition-colors duration-300" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-200">{t.editorTitle}</h2>
          
          <div className="flex items-center space-x-2">
             {/* Zoom Controls */}
             <div className="flex items-center space-x-1 mr-4 border-r border-gray-300 dark:border-gray-700 pr-4">
               <button onClick={handleZoomOut} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition" title={t.zoomOut}><ZoomOut size={18} /></button>
               <span className="text-xs w-10 text-center text-gray-500 dark:text-gray-400 font-medium select-none">{Math.round(zoom * 100)}%</span>
               <button onClick={handleZoomIn} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition" title={t.zoomIn}><ZoomIn size={18} /></button>
               <button onClick={handleZoomReset} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition ml-1" title={t.zoomReset}><Search size={16} /></button>
             </div>

             <button 
               onClick={handleUndo} 
               disabled={currentIndex <= 0}
               className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition rounded hover:bg-gray-100 dark:hover:bg-gray-800"
               title={t.undo}
             >
               <Undo size={18} />
             </button>
             <button 
               onClick={handleRedo} 
               disabled={currentIndex >= history.length - 1}
               className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition rounded hover:bg-gray-100 dark:hover:bg-gray-800"
               title={t.redo}
             >
               <Redo size={18} />
             </button>
             <button 
               onClick={handleReset} 
               disabled={currentIndex === 0 && history.length === 1}
               className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition rounded hover:bg-gray-100 dark:hover:bg-gray-800"
               title={t.reset}
             >
               <RotateCcw size={18} />
             </button>
             <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
             <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <X />
             </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tools Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-850 p-4 border-r border-gray-200 dark:border-gray-800 space-y-4 flex-shrink-0 z-20">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.aiTools}</div>
            
            <button 
              onClick={() => handleAiAction('bg')}
              disabled={isProcessing}
              className="w-full flex items-center p-3 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              <Eraser className="mr-3 text-emerald-500 dark:text-emerald-400" size={18} />
              {t.removeBg}
            </button>

            <button 
              onClick={() => handleAiAction('enhance')}
              disabled={isProcessing}
              className="w-full flex items-center p-3 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              <Wand2 className="mr-3 text-blue-500 dark:text-blue-400" size={18} />
              {t.enhance}
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
            
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.manualCrop}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {t.cropInstructions}
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-950 flex overflow-auto relative select-none custom-scrollbar">
            <div className="min-w-full min-h-full flex items-center justify-center p-10">
                {isProcessing && (
                   <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm fixed top-0 left-0 w-full h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                        {t.processing}
                      </span>
                   </div>
                )}
                
                <div 
                  className="relative inline-block border border-gray-300 dark:border-gray-700 shadow-xl cursor-crosshair bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2YwZjBmMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZThlOGU4IiAvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZThlOGU4IiAvPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIyMiI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzMzMzIiAvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzMzMzIiAvPjwvc3ZnPg==')]"
                  onMouseDown={handleMouseDown}
                  // Allow the container to grow with the zoomed image
                  style={{
                    width: imageRef.current ? imageRef.current.width * zoom : 'auto',
                    height: imageRef.current ? imageRef.current.height * zoom : 'auto',
                  }}
                >
                  <img 
                    ref={imageRef}
                    src={currentImage} 
                    alt="Editing" 
                    className="max-h-[75vh] max-w-[90vw] pointer-events-none block"
                    style={{ 
                       transform: `scale(${zoom})`, 
                       transformOrigin: 'top left',
                       transition: 'transform 0.1s ease-out',
                    }} 
                    draggable={false}
                  />
                  
                  {/* Crop Overlay */}
                  {crop && (
                    <div 
                      className="absolute border-2 border-white bg-emerald-500/20 shadow-[0_0_0_4000px_rgba(0,0,0,0.5)]"
                      style={{
                        left: crop.w < 0 ? crop.x + crop.w : crop.x,
                        top: crop.h < 0 ? crop.y + crop.h : crop.y,
                        width: Math.abs(crop.w),
                        height: Math.abs(crop.h)
                      }}
                    />
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end px-6 space-x-4 bg-white dark:bg-gray-900 transition-colors z-20">
           <button onClick={onClose} className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">{t.cancel}</button>
           <button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-6 py-2 rounded font-medium flex items-center shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/20">
             <Check size={18} className="mr-2" />
             {t.confirm}
           </button>
        </div>
      </div>
    </div>
  );
};

export default EditorModal;