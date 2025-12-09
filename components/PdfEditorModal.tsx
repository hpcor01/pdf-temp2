import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { ImageItem, Language } from '../types';
import { TRANSLATIONS } from '../constants';

// Declare globals for libraries loaded via CDN
declare global {
  interface Window {
    pdfjsLib: any;
    PDFLib: any;
  }
}

interface PdfEditorModalProps {
  item: ImageItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedItem: ImageItem) => void;
  language: Language;
}

interface PdfPage {
  originalIndex: number;
  thumbnail: string;
  id: string;
}

const PdfEditorModal: React.FC<PdfEditorModalProps> = ({ item, isOpen, onClose, onUpdate, language }) => {
  const t = TRANSLATIONS[language];
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && item.type === 'pdf') {
      loadPdfPages();
    }
  }, [isOpen, item]);

  const loadPdfPages = async () => {
    setIsLoading(true);
    try {
      if (!window.pdfjsLib) {
        console.error("PDF.js not loaded");
        return;
      }

      // 1. Fetch data
      const response = await fetch(item.url);
      const arrayBuffer = await response.arrayBuffer();

      // 2. Load PDF Document using PDF.js
      const loadingTask = window.pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const loadedPages: PdfPage[] = [];

      // 3. Render each page to canvas to get a thumbnail
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnails
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          loadedPages.push({
            originalIndex: i - 1, // 0-based index for pdf-lib
            thumbnail: canvas.toDataURL(),
            id: Math.random().toString(36).substr(2, 9)
          });
        }
      }
      setPages(loadedPages);
    } catch (error) {
      console.error("Error loading PDF pages:", error);
      alert("Failed to load PDF pages.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!window.PDFLib) {
      alert("PDF Lib not loaded");
      return;
    }
    
    setIsLoading(true);
    try {
      const { PDFDocument } = window.PDFLib;

      // Load original PDF
      const originalArrayBuffer = await fetch(item.url).then(res => res.arrayBuffer());
      const originalPdf = await PDFDocument.load(originalArrayBuffer);
      
      // Create new PDF
      const newPdf = await PDFDocument.create();
      
      // Copy pages in the new order
      const pageIndices = pages.map(p => p.originalIndex);
      const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
      
      copiedPages.forEach((page: any) => newPdf.addPage(page));

      // Save to bytes
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const newUrl = URL.createObjectURL(blob);

      onUpdate({
        ...item,
        url: newUrl
      });
      onClose();
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert("Error saving PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePage = (index: number) => {
    const newPages = [...pages];
    newPages.splice(index, 1);
    setPages(newPages);
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index > 0) {
      const newPages = [...pages];
      [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
      setPages(newPages);
    } else if (direction === 'right' && index < pages.length - 1) {
      const newPages = [...pages];
      [newPages[index + 1], newPages[index]] = [newPages[index], newPages[index + 1]];
      setPages(newPages);
    }
  };

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    // Required for Firefox
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    // Simple reorder visual logic
    const newPages = [...pages];
    const item = newPages.splice(draggedItem, 1)[0];
    newPages.splice(index, 0, item);
    
    setPages(newPages);
    setDraggedItem(index);
  };

  const onDragEnd = () => {
    setDraggedItem(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-[80vw] h-[80vh] rounded-lg flex flex-col border border-gray-300 dark:border-gray-700 shadow-2xl transition-colors duration-300">
        
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-200">{t.pdfEditorTitle}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-950">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-emerald-500">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
               <span>{t.loadingPdf}</span>
            </div>
          ) : pages.length === 0 ? (
             <div className="h-full flex items-center justify-center text-gray-500">
               No pages found.
             </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {pages.map((page, index) => (
                <div 
                  key={page.id} 
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDragEnd={onDragEnd}
                  className={`relative group bg-white dark:bg-gray-800 p-2 rounded shadow-sm border-2 transition-colors cursor-move
                    ${draggedItem === index ? 'border-emerald-500 opacity-50' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <div className="aspect-[1/1.4] bg-gray-200 dark:bg-gray-900 mb-2 overflow-hidden rounded">
                    <img src={page.thumbnail} alt={`Page ${index + 1}`} className="w-full h-full object-contain" draggable={false} />
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 px-1">
                    <span>{t.page} {index + 1}</span>
                    <button 
                      onClick={() => handleDeletePage(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Move Controls (for non-drag accessible use) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex flex-col space-y-1">
                     <button 
                       disabled={index === 0} 
                       onClick={(e) => { e.stopPropagation(); movePage(index, 'left'); }}
                       className="bg-black/50 text-white p-1 rounded-full hover:bg-emerald-500 disabled:opacity-0 transition"
                     >
                       <ArrowLeft size={12} />
                     </button>
                     <button 
                       disabled={index === pages.length - 1} 
                       onClick={(e) => { e.stopPropagation(); movePage(index, 'right'); }}
                       className="bg-black/50 text-white p-1 rounded-full hover:bg-emerald-500 disabled:opacity-0 transition"
                     >
                       <ArrowRight size={12} />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end px-6 space-x-4 bg-white dark:bg-gray-900">
           <button onClick={onClose} className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">{t.cancel}</button>
           <button 
             onClick={handleSave} 
             disabled={pages.length === 0}
             className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-6 py-2 rounded font-medium flex items-center shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <Save size={18} className="mr-2" />
             {t.savePdf}
           </button>
        </div>
      </div>
    </div>
  );
};

export default PdfEditorModal;