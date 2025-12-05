import React, { useState } from 'react';
import { Trash2, FileText, Plus, Search, RotateCw } from 'lucide-react';
import { DocumentGroup, ImageItem, AppSettings, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface DocumentColumnProps {
  document: DocumentGroup;
  settings: AppSettings;
  onAddItem: (docId: string, files: FileList) => void;
  onRemoveItem: (docId: string, itemId: string) => void;
  onEditItem: (item: ImageItem) => void;
  onRenameDoc: (docId: string, name: string) => void;
  onDeleteDoc: (docId: string) => void;
  onToggleSelection: (docId: string, selected: boolean) => void;
  onRotateItem?: (docId: string, itemId: string) => void;
  onReorderItems?: (docId: string, fromIndex: number, toIndex: number) => void;
  onReorderDocuments?: (fromIndex: number, toIndex: number) => void;
  onMoveItem?: (fromDocId: string, toDocId: string, itemId: string) => void;
  documentIndex: number;
  language: Language;
}

const DocumentColumn: React.FC<DocumentColumnProps> = ({
  document,
  settings,
  onAddItem,
  onRemoveItem,
  onEditItem,
  onRenameDoc,
  onDeleteDoc,
  onToggleSelection,
  onRotateItem,
  onReorderItems,
  onReorderDocuments,
  onMoveItem,
  documentIndex,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredPreviewId, setHoveredPreviewId] = useState<string | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [isColumnDragging, setIsColumnDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedFromDocId, setDraggedFromDocId] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddItem(document.id, e.target.files);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddItem(document.id, e.dataTransfer.files);
    }
  };

  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    setDraggedItemId(document.items[index].id);
    setDraggedFromDocId(document.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleItemDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemId && draggedFromDocId) {
      if (draggedFromDocId === document.id) {
        // Reordering within the same column
        if (draggedItemIndex !== null && draggedItemIndex !== dropIndex && onReorderItems) {
          onReorderItems(document.id, draggedItemIndex, dropIndex);
        }
      } else {
        // Moving from another column
        if (onMoveItem) {
          onMoveItem(draggedFromDocId, document.id, draggedItemId);
        }
      }
    }
    setDraggedItemIndex(null);
    setDraggedItemId(null);
    setDraggedFromDocId(null);
  };

  const handleItemDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleColumnDragStart = (e: React.DragEvent) => {
    setDraggedColumnIndex(documentIndex);
    setIsColumnDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedColumnIndex !== null && draggedColumnIndex !== dropIndex && onReorderDocuments) {
      onReorderDocuments(draggedColumnIndex, dropIndex);
    }
    setDraggedColumnIndex(null);
    setIsColumnDragging(false);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnIndex(null);
    setIsColumnDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleColumnDragStart}
      onDragOver={(e) => { handleColumnDragOver(e); handleDragOver(e); }}
      onDragLeave={handleDragLeave}
      onDrop={(e) => { handleColumnDrop(e, documentIndex); handleDrop(e); }}
      onDragEnd={handleColumnDragEnd}
      className={`w-80 flex-shrink-0 flex flex-col border rounded-xl overflow-hidden h-full mr-4 relative group transition-colors duration-200 cursor-move
        ${isDragging
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
          : isColumnDragging
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 opacity-50'
          : 'bg-white dark:bg-[#18181B] border-gray-300 dark:border-gray-700'}`}
    >
      {/* Header */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors">
        <div className="flex items-center space-x-3">
          {/* Selection Checkbox */}
          <input 
             type="checkbox" 
             checked={document.selected}
             onChange={(e) => onToggleSelection(document.id, e.target.checked)}
             className="custom-checkbox"
          />
          
          <div className="flex flex-col">
            <input 
              value={document.title}
              onChange={(e) => onRenameDoc(document.id, e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-b border-emerald-500 w-32 placeholder-gray-500"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.total}: {document.items.length}</span>
          </div>
        </div>
        
        <div className="flex space-x-1">
           <button 
             onClick={() => onDeleteDoc(document.id)} 
             className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-md transition"
             title={t.deleteDoc}
           >
             <Trash2 size={15} />
           </button>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-white dark:bg-transparent">
        {document.items.length === 0 && (
          <div className={`h-40 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 border-2 border-dashed rounded-lg m-2 pointer-events-none transition-colors
            ${isDragging ? 'border-emerald-500 text-emerald-500' : 'border-gray-200 dark:border-gray-700'}`}>
            <span className="text-sm">{isDragging ? t.dropHere : t.dragDrop}</span>
          </div>
        )}
        
        {document.items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleItemDragStart(e, index)}
            onDragOver={handleItemDragOver}
            onDrop={(e) => handleItemDrop(e, index)}
            onDragEnd={handleItemDragEnd}
            className={`relative group/item bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 flex items-center space-x-3 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition shadow-sm cursor-move ${
              draggedItemIndex === index ? 'opacity-50' : ''
            }`}
          >
            
            {/* Thumbnail */}
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 relative border border-gray-200 dark:border-gray-700">
               {item.type === 'image' ? (
                 <>
                   <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                   {/* Magnifying Glass Overlay */}
                   <button 
                     className="absolute top-0 right-0 w-6 h-6 bg-white/90 dark:bg-gray-900/80 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors z-10 rounded-bl-lg"
                     onMouseEnter={() => setHoveredPreviewId(item.id)}
                     onMouseLeave={() => setHoveredPreviewId(null)}
                     onClick={(e) => {
                       e.stopPropagation();
                       onEditItem(item);
                     }}
                     title={t.search}
                   >
                     <Search size={12} />
                   </button>
                 </>
               ) : (
                 <FileText className="text-red-500 dark:text-red-400" size={20} />
               )}
            </div>

            {/* Hover Preview Modal */}
            {hoveredPreviewId === item.id && item.type === 'image' && (
              <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                 <div className="bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-600 shadow-2xl max-w-[500px] max-h-[500px]">
                    <img src={item.url} alt="Preview" className="max-w-full max-h-[480px] object-contain rounded-lg" />
                 </div>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate mb-1">{item.name}</p>
              <div className="flex items-center space-x-2">
                {/* Edit Button (Visible for both Image and PDF) */}
                <button 
                    onClick={() => onEditItem(item)} 
                    className="text-[10px] bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 transition"
                >
                    {t.edit}
                </button>
                
                {/* Rotate Button (Image Only) */}
                {item.type === 'image' && onRotateItem && (
                  <button 
                    onClick={() => onRotateItem(document.id, item.id)}
                    className="text-[10px] bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 transition flex items-center"
                    title={t.rotate}
                  >
                    <RotateCw size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Delete Action (Absolute Top Right) */}
            <button 
              onClick={() => onRemoveItem(document.id, item.id)}
              className="absolute top-2.5 right-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
              title={t.deleteDoc}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer Add Area */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
         <label className="flex items-center justify-center w-full py-2.5 border border-gray-300 dark:border-gray-600 border-dashed rounded-lg text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-white dark:hover:bg-gray-800 transition cursor-pointer text-sm font-medium">
           <Plus size={16} className="mr-1.5" />
           {t.addFiles}
           <input 
             type="file" 
             multiple 
             accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
             className="hidden" 
             onChange={handleFileChange}
           />
         </label>
      </div>
    </div>
  );
};

export default DocumentColumn;