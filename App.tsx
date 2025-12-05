import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import TopBar from './components/TopBar';
import DocumentColumn from './components/DocumentColumn';
import EditorModal from './components/EditorModal';
import PdfEditorModal from './components/PdfEditorModal';
import Toast from './components/Toast';
import { DocumentGroup, AppSettings, ImageItem, Language, Theme } from './types';
import { INITIAL_SETTINGS, TRANSLATIONS } from './constants';
import { generatePDF } from './services/pdfService';

const App = () => {
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [documents, setDocuments] = useState<DocumentGroup[]>([
    { id: '1', title: 'PDF 1', items: [], selected: false }
  ]);
  const [editingItem, setEditingItem] = useState<{ docId: string, item: ImageItem } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [language, setLanguage] = useState<Language>('pt-BR');
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'light';
  });
  
  // Toast State
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const t = TRANSLATIONS[language];

  // --- Handlers ---

  const handleUpdateSetting = (key: keyof AppSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAddDocument = () => {
    const newId = (documents.length + 1).toString();
    setDocuments([...documents, { id: Date.now().toString(), title: `PDF ${newId}`, items: [], selected: false }]);
  };

  const handleDeleteDocument = (id: string) => {
    if (documents.length <= 1) return; // Prevent deleting last column
    setDocuments(documents.filter(d => d.id !== id));
  };

  const handleRenameDocument = (id: string, name: string) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, title: name } : d));
  };

  const handleToggleColumnSelection = (id: string, selected: boolean) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, selected } : d));
  };

  const handleToggleSelectAll = (selected: boolean) => {
    setDocuments(documents.map(d => ({ ...d, selected })));
  };

  const handleClearAll = () => {
    // Reset to single empty column
    setDocuments([{ id: Date.now().toString(), title: 'PDF 1', items: [], selected: false }]);
  };

  const handleAddItem = async (docId: string, files: FileList) => {
    const newItems: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const type = file.type === 'application/pdf' ? 'pdf' : 'image';
      
      newItems.push({
        id: Math.random().toString(36).substr(2, 9),
        url,
        originalFile: file,
        name: file.name,
        type,
        selected: false
      });
    }

    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, items: [...doc.items, ...newItems] } : doc
    ));
  };

  const handleRemoveItem = (docId: string, itemId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, items: doc.items.filter(i => i.id !== itemId) } 
        : doc
    ));
  };

  const handleEditItem = (docId: string, item: ImageItem) => {
    setEditingItem({ docId, item });
  };

  const handleUpdateItem = (updatedItem: ImageItem) => {
    if (!editingItem) return;
    setDocuments(prev => prev.map(doc => {
      if (doc.id === editingItem.docId) {
        return {
          ...doc,
          items: doc.items.map(i => i.id === updatedItem.id ? updatedItem : i)
        };
      }
      return doc;
    }));
  };

  const handleRotateItem = async (docId: string, itemId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    const item = doc.items.find(i => i.id === itemId);
    if (!item || item.type !== 'image') return;

    // Use a canvas to rotate the image 90 degrees clockwise
    const img = new Image();
    img.src = item.url;
    await new Promise((resolve) => { img.onload = resolve; });

    const canvas = document.createElement('canvas');
    // Swap width and height for 90 deg rotation
    canvas.width = img.height;
    canvas.height = img.width;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Translate to center, rotate, translate back
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    const newUrl = canvas.toDataURL();

    const updatedItem = { ...item, url: newUrl };

    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          items: d.items.map(i => i.id === itemId ? updatedItem : i)
        };
      }
      return d;
    }));
  };

  const handleReorderItems = (docId: string, fromIndex: number, toIndex: number) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        const newItems = [...doc.items];
        const [movedItem] = newItems.splice(fromIndex, 1);
        newItems.splice(toIndex, 0, movedItem);
        return { ...doc, items: newItems };
      }
      return doc;
    }));
  };

  const handleReorderDocuments = (fromIndex: number, toIndex: number) => {
    setDocuments(prev => {
      const newDocuments = [...prev];
      const [movedDoc] = newDocuments.splice(fromIndex, 1);
      newDocuments.splice(toIndex, 0, movedDoc);
      return newDocuments;
    });
  };

  const handleSave = async () => {
    const docsToSave = documents.filter(doc => doc.selected);

    if (docsToSave.length === 0) {
      alert(language === 'en' ? "Select at least one column to save." : "Selecione pelo menos uma coluna para salvar.");
      return;
    }

    setIsSaving(true);
    try {
      await generatePDF(docsToSave);
      
      // Success Logic
      setToast({ visible: true, message: t.docSaved, type: 'success' });
      
      // Clear documents after a short delay to allow PDF generation/download to initiate
      setTimeout(() => {
        handleClearAll();
      }, 500);

    } catch (e) {
      console.error(e);
      setToast({ visible: true, message: t.docSaveError, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  const allSelected = documents.length > 0 && documents.every(d => d.selected);

  return (
    <div className={theme}>
      <div 
        className={`flex flex-col h-screen w-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white font-sans transition-colors duration-300 relative`}
      >
        <TopBar 
          settings={settings} 
          updateSetting={handleUpdateSetting} 
          onSave={handleSave}
          onClearAll={handleClearAll}
          isSaving={isSaving}
          allSelected={allSelected}
          onToggleSelectAll={handleToggleSelectAll}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Main Workspace */}
        <main className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col">
          <div className="flex-1 w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl relative flex flex-col overflow-hidden transition-colors dark:bg-[#232B3A]">
            
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6 custom-scrollbar">
              <div className="flex h-full"> 
                {documents.map((doc, index) => (
                  <DocumentColumn
                    key={doc.id}
                    document={doc}
                    settings={settings}
                    onAddItem={handleAddItem}
                    onRemoveItem={handleRemoveItem}
                    onEditItem={(item) => handleEditItem(doc.id, item)}
                    onRenameDoc={handleRenameDocument}
                    onDeleteDoc={handleDeleteDocument}
                    onToggleSelection={handleToggleColumnSelection}
                    onRotateItem={handleRotateItem}
                    onReorderItems={handleReorderItems}
                    onReorderDocuments={handleReorderDocuments}
                    documentIndex={index}
                    language={language}
                  />
                ))}
                
                {/* Empty spacer for visual balance when scrolling right */}
                <div className="w-20 flex-shrink-0" />
              </div>
            </div>

            {/* Floating Action Button - Positioned inside the dashed frame */}
            <button 
              onClick={handleAddDocument}
              className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full shadow-2xl flex items-center justify-center text-white transition transform hover:scale-105 z-30"
              title="Nova Coluna"
            >
              <Plus size={32} />
            </button>
          </div>

          {/* Footer - Outside the dashed frame, bottom of screen area */}
          <footer className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 space-y-1 pb-1">
             <p>Αρχή - "E não nos cansemos de fazer o bem, porque a seu tempo ceifaremos" — Gálatas 6:9.</p>
             <p>Αν δεν αποκάμνουμε, θα θερίσουμε στον κατάλληλο καιρό. — ΠΡΟΣ ΓΑΛΑΤΑΣ 6:9β.</p>
             <p>©{new Date().getFullYear()} - Todos os direitos reservados.</p>
          </footer>
        </main>

        {/* Toast Notification */}
        <Toast 
          message={toast.message}
          type={toast.type}
          isVisible={toast.visible}
          onClose={() => setToast({ ...toast, visible: false })}
          language={language}
        />

        {/* Image Editor Modal */}
        {editingItem && editingItem.item.type === 'image' && (
          <EditorModal 
            item={editingItem.item}
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onUpdate={handleUpdateItem}
            language={language}
          />
        )}

        {/* PDF Editor Modal */}
        {editingItem && editingItem.item.type === 'pdf' && (
          <PdfEditorModal
            item={editingItem.item}
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onUpdate={handleUpdateItem}
            language={language}
          />
        )}
      </div>
    </div>
  );
};

export default App;