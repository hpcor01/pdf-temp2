import React, { useState, useRef, useEffect } from 'react';
<<<<<<< HEAD
import { X, Wand2, Eraser, Check, Undo, RotateCcw, Redo, ZoomIn, ZoomOut, Search, Sparkles, Brush } from 'lucide-react';
=======
import { X, Wand2, Eraser, Check, Undo, RotateCcw, Redo, ZoomIn, ZoomOut, Search } from 'lucide-react';
>>>>>>> ae3e811bb63fb9a3b17d7b8fc6399631f13b12b1
import { ImageItem, Language } from '../types';
import { removeBackground, enhanceImage, magicEraser } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';

interface EditorModalProps {
  item: ImageItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedItem: ImageItem) => void;
  language: Language;
}

type Tool = 'none' | 'crop' | 'eraser';

interface Point {
  x: number;
  y: number;
}

const EditorModal: React.FC<EditorModalProps> = ({ item, isOpen, onClose, onUpdate, language }) => {
  const t = TRANSLATIONS[language];
  
  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('crop'); // default to crop selection logic
  
  // Crop State
  const [crop, setCrop] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [startPos, setStartPos] = useState<Point | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Eraser State
  const [maskLines, setMaskLines] = useState<{ points: Point[], size: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  // Zoom State
  const [zoom, setZoom] = useState(1);
  
  // Zoom State
  const [zoom, setZoom] = useState(1);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHistory([item.url]);
      setCurrentIndex(0);
      setCrop(null);
      setMaskLines([]);
      setIsSelecting(false);
      setZoom(1);
<<<<<<< HEAD
      setActiveTool('none');
      setCursorPos(null);
=======
>>>>>>> ae3e811bb63fb9a3b17d7b8fc6399631f13b12b1
    }
  }, [item, isOpen]);

  // Derived state
  const currentImage = history[currentIndex] || item.url;

  // Render the mask canvas whenever lines change or zoom/image size changes
  useEffect(() => {
    if (!maskCanvasRef.current || !imageRef.current) return;
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image natural size
    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw lines
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Translucent Red
    
    maskLines.forEach(line => {
      if (line.points.length < 1) return;
      ctx.lineWidth = line.size;
      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      ctx.stroke();
    });

  }, [maskLines, currentImage, zoom]); // Re-render when lines or image updates

  if (!isOpen) return null;

  const pushToHistory = (newUrl: string) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newUrl);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    // Reset temporary states
    setMaskLines([]);
    setCrop(null);
  };

  const handleUndo = () => {
    if (activeTool === 'eraser' && maskLines.length > 0) {
      // If drawing, undo last line
      setMaskLines(prev => prev.slice(0, -1));
    } else if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCrop(null);
      setMaskLines([]);
    }
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCrop(null);
      setMaskLines([]);
    }
  };

  const handleReset = () => {
    if (history.length > 0) {
      setCurrentIndex(0);
      setCrop(null);
      setZoom(1);
<<<<<<< HEAD
      setMaskLines([]);
      setActiveTool('none');
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.1));
  const handleZoomReset = () => setZoom(1);

  // --- AI Actions ---

=======
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));
  const handleZoomReset = () => setZoom(1);

>>>>>>> ae3e811bb63fb9a3b17d7b8fc6399631f13b12b1
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
    } catch (e) {
<<<<<<< HEAD
      alert("AI processing failed. Check API Key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyEraser = async () => {
    if (maskLines.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Create a composite canvas (Image + Mask)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = currentImage;
      
      await new Promise(resolve => { img.onload = resolve; });
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      if (ctx) {
        // Draw Original
        ctx.drawImage(img, 0, 0);
        // Draw Mask Lines
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        
        maskLines.forEach(line => {
          if (line.points.length < 1) return;
          ctx.lineWidth = line.size;
          ctx.beginPath();
          ctx.moveTo(line.points[0].x, line.points[0].y);
          for (let i = 1; i < line.points.length; i++) {
             ctx.lineTo(line.points[i].x, line.points[i].y);
          }
          ctx.stroke();
        });

        // 2. Get Composite Base64
        const compositeUrl = canvas.toDataURL('image/png');
        
        // 3. Send to API
        const resultUrl = await magicEraser(compositeUrl);
        pushToHistory(resultUrl);
        setActiveTool('none');
      }
    } catch (e) {
      console.error(e);
      alert("Magic Eraser failed.");
=======
      alert("AI processing failed. Please check your API key.");
>>>>>>> ae3e811bb63fb9a3b17d7b8fc6399631f13b12b1
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    onUpdate({ ...item, url: currentImage });
    onClose();
  };

  // --- Mouse Event Handlers (Unified) ---

  const getImgCoordinates = (e: React.MouseEvent) => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    // Position relative to the *visual* element
    const xVisual = clientX - rect.left;
    const yVisual = clientY - rect.top;

    // Convert to *natural* image coordinates for drawing/processing
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    return {
      visual: { x: xVisual, y: yVisual, w: rect.width, h: rect.height },
      natural: { x: xVisual * scaleX, y: yVisual * scaleY }
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isProcessing) return;
    const coords = getImgCoordinates(e);
    if (!coords) return;

    if (activeTool === 'eraser') {
      setIsDrawing(true);
      setMaskLines(prev => [...prev, { points: [coords.natural], size: brushSize }]);
    } else {
      // Crop Logic (Default if not erasing)
      e.preventDefault();
      setStartPos(coords.visual);
      setCrop({ x: coords.visual.x, y: coords.visual.y, w: 0, h: 0 });
      setIsSelecting(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update visual cursor position whenever tool is eraser
    if (activeTool === 'eraser') {
      setCursorPos({ x: e.clientX, y: e.clientY });
    }

<<<<<<< HEAD
    const coords = getImgCoordinates(e);
    if (!coords) return;
=======
    const rect = imageRef.current.getBoundingClientRect();
    
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Constrain within the visual (zoomed) dimensions
    const currentX = Math.max(0, Math.min(rawX, rect.width));
    const currentY = Math.max(0, Math.min(rawY, rect.height));
>>>>>>> ae3e811bb63fb9a3b17d7b8fc6399631f13b12b1

    if (activeTool === 'eraser' && isDrawing) {
      setMaskLines(prev => {
        const last = prev[prev.length - 1];
        const newPoints = [...last.points, coords.natural];
        const updatedLast = { ...last, points: newPoints };
        return [...prev.slice(0, -1), updatedLast];
      });
    } else if (isSelecting && startPos) {
      e.preventDefault();
      
      const currentX = Math.max(0, Math.min(coords.visual.x, coords.visual.w));
      const currentY = Math.max(0, Math.min(coords.visual.y, coords.visual.h));

      const w = currentX - startPos.x;
      const h = currentY - startPos.y;

      setCrop({ x: startPos.x, y: startPos.y, w, h });
    }
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
<<<<<<< HEAD
=======
    
    // Important: rect.width includes the zoom scale. 
    // We compare natural dimensions to visual dimensions to get the correct crop ratio.
>>>>>>> ae3e811bb63fb9a3b17d7b8fc6399631f13b12b1
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
    if (activeTool === 'eraser') {
      setIsDrawing(false);
    } else if (isSelecting) {
      setIsSelecting(false);
      if (crop && Math.abs(crop.w) > 10 && Math.abs(crop.h) > 10) {
        applyCrop();
      } else {
        setCrop(null);
      }
    }
  };

  const handleMouseLeave = () => {
    if (activeTool === 'eraser') {
      setCursorPos(null);
      setIsDrawing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-default"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
               disabled={(activeTool === 'eraser' && maskLines.length === 0) && currentIndex <= 0}
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
<<<<<<< HEAD
          <div className="w-64 bg-gray-50 dark:bg-gray-850 p-4 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 z-20 overflow-y-auto">
            <div className="space-y-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.aiTools}</div>
              
              <button 
                onClick={() => { setActiveTool('none'); handleAiAction('bg'); }}
                disabled={isProcessing || activeTool === 'eraser'}
                className="w-full flex items-center p-3 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                <Eraser className="mr-3 text-emerald-500 dark:text-emerald-400" size={18} />
                {t.removeBg}
              </button>
=======
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
>>>>>>> ae3e811bb63fb9a3b17d7b8fc6399631f13b12b1

              <button 
                onClick={() => { setActiveTool('none'); handleAiAction('enhance'); }}
                disabled={isProcessing || activeTool === 'eraser'}
                className="w-full flex items-center p-3 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                <Wand2 className="mr-3 text-blue-500 dark:text-blue-400" size={18} />
                {t.enhance}
              </button>

              {/* Magic Eraser Tool */}
              <div className={`border rounded-lg p-3 transition ${activeTool === 'eraser' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                <button 
                  onClick={() => setActiveTool(activeTool === 'eraser' ? 'none' : 'eraser')}
                  className="w-full flex items-center text-left mb-2 text-gray-700 dark:text-gray-200"
                >
                  <Sparkles className="mr-3 text-purple-500 dark:text-purple-400" size={18} />
                  <span className="font-medium text-sm">{t.magicEraser}</span>
                </button>
                
                {activeTool === 'eraser' && (
                  <div className="mt-3 space-y-3 animate-fade-in">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.eraserInstructions}</p>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block flex justify-between">
                         <span>{t.brushSize}</span>
                         <span>{brushSize}px</span>
                      </label>
                      <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        value={brushSize} 
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-emerald-500"
                      />
                    </div>
                    <button 
                      onClick={handleApplyEraser}
                      disabled={maskLines.length === 0 || isProcessing}
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium disabled:opacity-50 transition"
                    >
                      {t.applyEraser}
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
              
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.manualCrop}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {activeTool === 'eraser' ? t.eraserInstructions : t.cropInstructions}
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-950 flex overflow-auto relative select-none custom-scrollbar">
            <div className="min-w-full min-h-full flex items-center justify-center p-10">
                {isProcessing && (
<<<<<<< HEAD
                   <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
=======
                   <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm fixed top-0 left-0 w-full h-full">
>>>>>>> ae3e811bb63fb9a3b17d7b8fc6399631f13b12b1
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                        {t.processing}
                      </span>
                   </div>
                )}
                
                <div 
<<<<<<< HEAD
                  className={`relative inline-block border border-gray-300 dark:border-gray-700 shadow-xl 
                    ${activeTool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'}
                    bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2YwZjBmMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZThlOGU4IiAvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZThlOGU4IiAvPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIyMiI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzMzMzIiAvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzMzMzIiAvPjwvc3ZnPg==')]`}
=======
                  className="relative inline-block border border-gray-300 dark:border-gray-700 shadow-xl cursor-crosshair bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2YwZjBmMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZThlOGU4IiAvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZThlOGU4IiAvPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIyMiI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzMzMzIiAvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzMzMzIiAvPjwvc3ZnPg==')]"
>>>>>>> ae3e811bb63fb9a3b17d7b8fc6399631f13b12b1
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
<<<<<<< HEAD

                  {/* Eraser Mask Canvas Overlay */}
                  <canvas 
                    ref={maskCanvasRef}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  
                  {/* Custom Brush Cursor (Visible during hover) */}
                  {activeTool === 'eraser' && cursorPos && (
                    <div 
                       className="fixed pointer-events-none z-50 rounded-full border border-white shadow-sm bg-purple-500/30"
                       style={{
                         width: brushSize * zoom,
                         height: brushSize * zoom,
                         left: cursorPos.x - (brushSize * zoom) / 2,
                         top: cursorPos.y - (brushSize * zoom) / 2,
                       }}
                    />
                  )}

                  {/* Crop Overlay */}
                  {crop && activeTool !== 'eraser' && (
                    <div 
                      className="absolute border-2 border-white bg-emerald-500/20 shadow-[0_0_0_4000px_rgba(0,0,0,0.5)] pointer-events-none"
=======
                  
                  {/* Crop Overlay */}
                  {crop && (
                    <div 
                      className="absolute border-2 border-white bg-emerald-500/20 shadow-[0_0_0_4000px_rgba(0,0,0,0.5)]"
>>>>>>> ae3e811bb63fb9a3b17d7b8fc6399631f13b12b1
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