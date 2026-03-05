import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useTransactionStore } from '../stores/useTransactionStore';
import { Icon } from '../components/ui/Icon';

type TabType = 'expense' | 'income';

export default function InputPage() {
  const { categories, addTransaction } = useTransactionStore();
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNumpad, setShowNumpad] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [animations, setAnimations] = useState<{ id: number; x: number; y: number; amount: string; type: TabType }[]>([]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedCategory(null);
  };

  const categoriesToDisplay = categories.filter(c => c.type === (activeTab === 'income' ? 'income' : 'expense'));

  const formatDate = (date: Date) => {
    const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year} (${days[date.getDay()]})`;
  };

  const changeDate = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    
    // Check if newDate is in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (newDate > today) return;
    
    setSelectedDate(newDate);
  };

  const formatAmount = (value: string) => {
    const num = value.replace(/[^\d]/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('vi-VN');
  };

  const handleNumpadPress = (key: string) => {
    if (key === 'AC') {
      setAmount('');
    } else if (key === 'Del') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === 'OK') {
      handleOk();
    } else if (['÷', '×', '-', '+'].includes(key)) {
      // Calculator - to implement
    } else {
      // Avoid leading zeros if unnecessary, but here just append
      setAmount((prev) => {
        if (prev === '' && (key === '0' || key === '00')) return '';
        return prev + key;
      });
    }
  };

  const NumBtn = ({ k, color = 'text-white' }: { k: string; color?: string }) => (
    <button
      onClick={() => handleNumpadPress(k)}
      className={`bg-[#2c2c2e] py-3 text-lg font-medium active:bg-[#3a3a3c] ${color}`}
    >
      {k}
    </button>
  );

  // Generate quick amount suggestions: append 1, 2, 3 zeros to what user typed
  const getQuickAmounts = () => {
    const num = amount.replace(/[^\d]/g, '');
    if (!num) return [];

    const base = parseInt(num);
    if (!base) return [];

    return [10, 100, 1000]
      .map(m => base * m)
      .filter(s => s >= 1000 && s <= 100_000_000);
  };

  const quickAmounts = getQuickAmounts();

  const handleOk = () => {
    if (!selectedCategory) {
      setCategoryError(true);
      setTimeout(() => setCategoryError(false), 500);
      return;
    }

    if (amount !== '') {
      const numAmount = parseInt(amount.replace(/[^\d]/g, ''));
      
      // Save to store
      addTransaction({
        type: activeTab,
        amount: numAmount,
        categoryId: selectedCategory,
        walletId: 'default', // Default wallet for now
        date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD
        note: note
      });

      const rect = document.getElementById(`category-${selectedCategory}`)?.getBoundingClientRect();
      if (rect) {
        const newAnim = {
          id: Date.now(),
          x: rect.left + rect.width / 2,
          y: rect.top,
          amount: (activeTab === 'expense' ? '-' : '+') + formatAmount(amount),
          type: activeTab
        };
        setAnimations(prev => [...prev, newAnim]);
        setTimeout(() => {
          setAnimations(prev => prev.filter(a => a.id !== newAnim.id));
        }, 1500);
      }
    }
    console.log('Save', { amount, selectedCategory, note, selectedDate });
    setShowNumpad(false);
    // Reset fields
    setAmount('');
    setNote('');
    setSelectedCategory(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex bg-[#2c2c2e] rounded-full p-0.5">
          <button

          
            onClick={() => handleTabChange('expense')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              activeTab === 'expense' ? 'bg-[#3a3a3c] text-white' : 'text-gray-400'
            }`}
          >
            Tiền chi
          </button>
          <button
            onClick={() => handleTabChange('income')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              activeTab === 'income' ? 'bg-[#3a3a3c] text-white' : 'text-gray-400'
            }`}
          >
            Tiền thu
          </button>
        </div>
        <button className="p-2 text-gray-400">
          <Pencil size={16} />
        </button>
      </div>

      {/* Date Selector */}
      <div className="flex items-center px-4 py-1.5">
        <span className="text-gray-400 text-sm w-14">Ngày</span>
        <div className="flex items-center flex-1 justify-center gap-1">
          <button onClick={() => changeDate(-1)} className="p-1">
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
          <div className="bg-[#2c2c2e] px-4 py-1.5 rounded-lg min-w-[170px] text-center">
            <span className="text-white text-sm">{formatDate(selectedDate)}</span>
          </div>
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="px-2 py-1 text-[10px] bg-[#3a3a3c] text-[#5ac8fa] rounded-md font-bold hover:bg-[#4a4a4c] active:scale-90 transition-all border border-[#5ac8fa]/20"
          >
            Hôm nay
          </button>
          <button 
            onClick={() => changeDate(1)} 
            disabled={new Date(selectedDate).toDateString() === new Date().toDateString()}
            className="p-1 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Note Input */}
      <div className="flex items-center px-4 py-1.5">
        <span className="text-gray-400 text-sm w-14">Ghi chú</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Chưa nhập vào"
          className="flex-1 bg-transparent text-gray-400 placeholder:text-gray-600 outline-none text-sm"
        />
      </div>

      {/* Amount Display */}
      <div className={`flex items-center px-4 py-1.5 transition-all duration-200 ${showNumpad ? 'relative z-20 bg-[#1c1c1e]' : ''}`}>
        <span className="text-gray-400 text-sm w-14">{activeTab === 'expense' ? 'Tiền chi' : 'Tiền thu'}</span>
        <button
          onClick={() => {
            if (!selectedCategory) {
                setCategoryError(true);
                setTimeout(() => setCategoryError(false), 500);
                return;
              }
            setShowNumpad(true)
          }}
          className={`flex-1 px-3 py-2 min-h-[46px] flex items-center justify-end rounded-lg transition-all duration-200 border ${
            showNumpad 
              ? activeTab === 'expense' 
                ? 'bg-[#3a3a3c] border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-[#3a3a3c] border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
              : 'bg-[#2c2c2e] border-transparent'
          }`}
        >
          <span className={`text-lg font-bold transition-colors ${
            showNumpad 
              ? activeTab === 'expense' ? 'text-red-400' : 'text-green-400'
              : amount === '' ? 'text-gray-600' : 'text-white'
          }`}>
            {amount === '' ? '0' : formatAmount(amount)}
            {showNumpad && (
              <span className={`inline-block w-[1.5px] h-[1.2em] align-middle ml-0.5 animate-pulse ${
                activeTab === 'expense' ? 'bg-red-400' : 'bg-green-400'
              }`} />
            )}
          </span>
        </button>
        <span className={`ml-2 text-sm transition-colors ${
          showNumpad 
            ? activeTab === 'expense' ? 'text-red-400' : 'text-green-400'
            : 'text-gray-400'
        }`}>đ</span>
      </div>

      {/* Categories */}
      <div className={`flex-1 overflow-y-auto px-3 py-1 min-h-0 transition-all rounded-xl mx-2 mt-2 border border-transparent ${categoryError ? 'animate-shake-red' : ''}`}>
        <h3 className="text-gray-400 text-xs mb-1.5">Danh mục</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {categoriesToDisplay.map((cat) => (
            <button
              key={`${activeTab}-${cat.id}`}
              id={`category-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex flex-col items-center py-2 rounded-lg transition-all active:scale-95 ${
                selectedCategory === cat.id ? 'bg-[#3a3a3c] ring-1 ring-gray-500' : 'bg-[#2c2c2e]'
              }`}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all ${
                  selectedCategory === cat.id ? 'scale-110 shadow-lg' : ''
                }`}
                style={{ 
                  backgroundColor: selectedCategory === cat.id ? cat.color : `${cat.color}22`,
                  color: selectedCategory === cat.id ? 'white' : cat.color 
                }}
              >
                <Icon name={cat.icon} size={20} />
              </div>
              <span className="text-[10px] text-white mt-0.5 truncate w-full text-center px-1">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button - shown when numpad is hidden */}
      {!showNumpad && (
        <div className="shrink-0 px-4 py-3 bg-black">
          <button
            onClick={() => {
              if (!selectedCategory) {
                setCategoryError(true);
                setTimeout(() => setCategoryError(false), 500);
                return;
              }
              setShowNumpad(true);
            }}
            className="w-full py-3 bg-[#2c2c2e] rounded-xl text-white font-medium text-base active:bg-[#3a3a3c]"
          >
            Nhập khoản chi
          </button>
        </div>
      )}

      {/* Numpad Overlay */}
      {showNumpad && (
        <div
          className="absolute inset-0 bg-black/50 z-10"
          onClick={() => setShowNumpad(false)}
        />
      )}

      {/* Numpad - slides up from bottom */}
      {showNumpad && (
        <div className="absolute left-0 right-0 bottom-0 bg-[#1c1c1e] z-20 animate-slide-up pb-[max(8px,env(safe-area-inset-bottom))]">
          <div className="p-1">
            {/* Quick amount suggestions ... */}
            {quickAmounts.length > 0 && (
              <div className="flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="px-3 py-1.5 bg-[#3a3a3c] rounded-full text-xs text-white whitespace-nowrap active:bg-[#4a4a4c]"
                  >
                    {amt.toLocaleString('vi-VN')}đ
                  </button>
                ))}
              </div>
            )}

            <div className="flex">
              {/* Main grid 4x4 */}
              <div className="flex-1 grid grid-cols-3 gap-1 bg-transparent">
                <NumBtn k="7" /><NumBtn k="8" /><NumBtn k="9" />
                <NumBtn k="4" /><NumBtn k="5" /><NumBtn k="6" />
                <NumBtn k="1" /><NumBtn k="2" /><NumBtn k="3" />
                <NumBtn k="0" /><NumBtn k="00" /><div className="bg-transparent" />
              </div>

              {/* Right column */}
              <div className="w-14 flex flex-col gap-1 ml-1">
                <NumBtn k="AC" />
                <NumBtn k="Del" color="text-[#ff3b30]" />
                <button
                  onClick={() => handleNumpadPress('OK')}
                  className="bg-[#2c2c2e] flex-1 text-[#5ac8fa] text-lg font-medium active:bg-[#3a3a3c] rounded-md"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Flying Animations */}
      {animations.map((anim) => (
        <div
          key={anim.id}
          className={`fixed pointer-events-none z-[100] font-bold text-lg animate-fly-up ${
            anim.type === 'expense' ? 'text-red-400' : 'text-green-400'
          }`}
          style={{
            left: anim.x,
            top: anim.y,
          }}
        >
          {anim.amount}
        </div>
      ))}
    </div>
  );
}
