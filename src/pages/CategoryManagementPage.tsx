import { useState } from 'react';
import { ChevronLeft, Plus, Pencil, Trash2, X, Check, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useTransactionStore } from '../stores/useTransactionStore';
import type { Category } from '../types';
import { useNavigate } from 'react-router-dom';
import { Icon, ALL_ICONS } from '../components/ui/Icon';
import { Search } from 'lucide-react';

type TabType = 'expense' | 'income';

export default function CategoryManagementPage() {
  const navigate = useNavigate();
  const { categories, addCategory, updateCategory, deleteCategory, fetchDataFromSheet } = useTransactionStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [color, setColor] = useState('#8e8e93');
  const [iconSearch, setIconSearch] = useState('');

  const filteredCategories = categories
    .filter(c => c.type === activeTab)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingCategory) {
      updateCategory({
        ...editingCategory,
        name: name.trim(),
        icon,
        color,
      });
    } else {
      addCategory({
        name: name.trim(),
        icon,
        color,
        type: activeTab,
        order: filteredCategories.length,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingCategory(null);
    setIsAdding(false);
    setName('');
    setIcon('Wallet');
    setColor('#8e8e93');
    setIconSearch('');
  };

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này? Các giao dịch cũ sẽ không bị mất nhưng sẽ hiển thị là "Khác".')) {
      deleteCategory(id);
    }
  };

  const commonIcons = [
    'Utensils', 'ShoppingBag', 'Shirt', 'Sparkles', 'Users', 
    'Heart', 'GraduationCap', 'Zap', 'Car', 'Smartphone', 
    'Home', 'Banknote', 'TrendingUp', 'Gift', 'Gamepad2', 
    'Clapperboard', 'Plane', 'Dog', 'Trophy', 'Hammer',
    'Coffee', 'Pizza', 'Wine', 'Stethoscope', 'Book',
    'Bus', 'Bike', 'Monitor', 'Gamepad', 'Camera'
  ];

  const filteredIcons = iconSearch.trim() 
    ? ALL_ICONS.filter(i => i.toLowerCase().includes(iconSearch.toLowerCase()))
    : commonIcons;

  const commonColors = ['#ff9500', '#ffcc00', '#34c759', '#007aff', '#5856d6', '#ff2d55', '#af52de', '#f1c40f', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#e74c3c', '#95a5a6'];

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#222]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-white">Quản lý danh mục</h1>
        <div className="flex items-center gap-1">
          <button 
            onClick={async () => {
              setIsSyncing(true);
              await fetchDataFromSheet();
              setTimeout(() => setIsSyncing(false), 500);
            }} 
            className={`p-2 text-gray-400 active:text-white transition-all ${isSyncing ? 'animate-spin text-[#5ac8fa]' : ''}`}
            disabled={isSyncing}
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => setIsAdding(true)} 
            className="p-2 -mr-2 text-[#5ac8fa]"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#111] bg-[#0a0a0a]">
        {(['expense', 'income'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === tab ? 'text-[#5ac8fa] border-[#5ac8fa]' : 'text-gray-600 border-transparent'
            }`}
          >
            {tab === 'expense' ? 'Khoản chi' : 'Khoản thu'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-3">
        {filteredCategories.map((cat) => (
          <div 
            key={cat.id} 
            className="flex items-center justify-between bg-[#1c1c1e] p-4 rounded-2xl border border-[#333] group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-inner border border-[#444]"
                style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
              >
                <Icon name={cat.icon} size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-bold text-white">{cat.name}</div>
                  {cat.synced ? (
                    <Cloud size={12} className="text-[#34c759] opacity-50" />
                  ) : (
                    <CloudOff size={12} className="text-orange-500 opacity-50" />
                  )}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">ID: {cat.id.substring(0, 8)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => startEdit(cat)}
                className="p-2 rounded-full bg-[#2c2c2e] text-gray-400 active:text-white"
              >
                <Pencil size={18} />
              </button>
              <button 
                onClick={() => handleDelete(cat.id)}
                className="p-2 rounded-full bg-red-500/10 text-red-500 active:bg-red-500 active:text-white"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-20 text-gray-600 italic">
            Chưa có danh mục nào cho nhóm này
          </div>
        )}
      </div>

      {/* Upsert Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black animate-slide-up">
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#222]">
            <button onClick={resetForm} className="p-2 -ml-2 text-gray-400">
              <X size={24} />
            </button>
            <h1 className="text-lg font-bold text-white">
              {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
            </h1>
            <button 
              onClick={handleSave}
              className="p-2 -mr-2 text-[#5ac8fa] font-bold"
              disabled={!name.trim()}
            >
              <Check size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
            {/* Preview Section */}
            <div className="flex flex-col items-center gap-4 py-6">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-4 border-[#333]"
                style={{ backgroundColor: `${color}22`, color: color, borderColor: color }}
              >
                <Icon name={icon} size={48} />
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Xem trước</span>
              </div>
            </div>

            {/* Input Name */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tên danh mục</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Ăn uống, Tiền nhà..."
                className="w-full bg-[#1c1c1e] text-white text-lg font-bold p-4 rounded-2xl border border-[#333] outline-none focus:border-[#5ac8fa] transition-all"
                autoFocus
              />
            </div>

            {/* Icon Picker */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Biểu tượng</label>
                <div className="relative">
                  <input
                    type="text"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Tìm icon..."
                    className="bg-[#1c1c1e] text-xs py-2 pl-8 pr-3 rounded-full border border-[#333] outline-none focus:border-[#5ac8fa] w-32"
                  />
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-3 max-h-[160px] overflow-y-auto no-scrollbar p-1">
                {filteredIcons.map(i => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`h-12 rounded-xl flex items-center justify-center transition-all ${
                      icon === i ? 'bg-[#3a3a3c] ring-2 ring-[#5ac8fa]' : 'bg-[#1c1c1e] border border-[#333]'
                    }`}
                  >
                    <Icon name={i} size={24} color={icon === i ? '#5ac8fa' : '#888'} />
                  </button>
                ))}
              </div>
              {filteredIcons.length === 0 && (
                <div className="text-center py-4 text-gray-600 text-xs italic">
                  Không tìm thấy icon nào
                </div>
              )}
            </div>

            {/* Color Picker */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Màu sắc</label>
              <div className="flex flex-wrap gap-3">
                {commonColors.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={16} className="text-black" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-black border-t border-[#222]">
            <button 
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full py-4 bg-[#5ac8fa] text-black rounded-2xl font-bold text-lg active:scale-[0.98] transition-all disabled:opacity-30"
            >
              {editingCategory ? 'Cập nhật thay đổi' : 'Tạo danh mục ngay'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
