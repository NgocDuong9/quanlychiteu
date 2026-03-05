import { ChevronLeft, ChevronRight, Settings, Camera, Edit2, Copy } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTransactionStore } from '../stores/useTransactionStore';
import { Icon } from '../components/ui/Icon';

export default function BudgetPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNumpad, setShowNumpad] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState('0');

  const { transactions, budgets, categories: allCategories, setBudget, copyBudgets } = useTransactionStore();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const currentMonthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;

  const categories = useMemo(() => 
    allCategories.filter(c => c.type === 'expense'), 
    [allCategories]
  );

  // Calculate budget items based on store data
  const budgetItems = useMemo(() => {
    return categories.map(cat => {
      // Get budget from store - Ensuring comparison is robust
      const budgetEntry = budgets.find(b => 
        b.categoryId === cat.id && 
        b.month.substring(0, 7) === currentMonthStr
      );
      
      // Calculate spent from transactions
      const spent = transactions
        .filter(tx => tx.categoryId === cat.id && tx.type === 'expense' && tx.date.startsWith(currentMonthStr))
        .reduce((sum, tx) => sum + (isNaN(tx.amount) ? 0 : tx.amount), 0);

      return {
        ...cat,
        budget: budgetEntry ? budgetEntry.amount : null,
        spent
      };
    });
  }, [transactions, budgets, currentMonthStr, categories]);

  // Navigate months
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  // Format header
  const formatHeader = () => {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return {
      main: `${monthStr}/${year}`,
      range: `(01/${monthStr}-${daysInMonth}/${monthStr})`,
    };
  };

  const totalBudget = budgetItems.reduce((sum, item) => sum + (item.budget || 0), 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const remaining = totalBudget - totalSpent;

  const { main, range } = formatHeader();

  const handleSetBudget = (id: string, currentBudget: number | null) => {
    setEditingItemId(id);
    setTempAmount(currentBudget ? currentBudget.toString() : '0');
    setShowNumpad(true);
  };

  const formatAmount = (value: string) => {
    const num = value.replace(/[^\d]/g, '');
    if (!num) return '0';
    return Number(num).toLocaleString('vi-VN');
  };

  const handleNumpadPress = (key: string) => {
    if (key === 'AC') {
      setTempAmount('0');
    } else if (key === 'Del') {
      setTempAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (key === 'OK') {
      const amount = parseInt(tempAmount);
      if (editingItemId) {
        setBudget(editingItemId, amount, currentMonthStr);
      }
      setShowNumpad(false);
      setEditingItemId(null);
    } else {
      setTempAmount((prev) => {
        if (prev === '0' && key !== '00') return key;
        if (prev === '0' && key === '00') return '0';
        const next = prev + key;
        if (next.length > 12) return prev; // Limit
        return next;
      });
    }
  };

  const NumBtn = ({ k, color = 'text-white' }: { k: string; color?: string }) => (
    <button
      onClick={() => handleNumpadPress(k)}
      className={`bg-[#2c2c2e] py-4 text-xl font-medium active:bg-[#3a3a3c] transition-colors ${color}`}
    >
      {k}
    </button>
  );

  const editingItem = budgetItems.find(i => i.id === editingItemId);

  // Progress bar component
  const ProgressBar = ({ spent, budget, color }: { spent: number; budget: number | null; color: string }) => {
    const percentage = budget ? Math.min((spent / budget) * 100, 100) : 100;
    const isOverBudget = budget ? spent > budget : false;

    return (
      <div className="h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: budget ? `${percentage}%` : '0%',
            backgroundColor: isOverBudget ? '#ff3b30' : color,
          }}
        />
      </div>
    );
  };

  const handleCopyFromLastMonth = async () => {
    const lastMonthDate = new Date(currentDate);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonthStr = `${lastMonthDate.getFullYear()}-${(lastMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (confirm(`Bạn có muốn sao chép toàn bộ ngân sách từ tháng ${lastMonthDate.getMonth() + 1}/${lastMonthDate.getFullYear()} sang tháng hiện tại không?`)) {
      await copyBudgets(lastMonthStr, currentMonthStr);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <button className="p-2">
          <Camera size={20} className="text-gray-400" />
        </button>
        <h1 className="text-lg font-semibold">Ngân sách</h1>
        <button className="p-2">
          <Settings size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 px-4 py-2">
        <button onClick={() => changeMonth(-1)}>
          <ChevronLeft size={24} className="text-gray-400" />
        </button>
        <div className="bg-[#1c1c1e] px-8 py-3 rounded-xl text-center min-w-[200px] border border-white/5">
          <span className="text-lg font-medium">{main}</span>
          <span className="text-gray-500 text-sm ml-2">{range}</span>
        </div>
        <button onClick={() => changeMonth(1)}>
          <ChevronRight size={24} className="text-gray-400" />
        </button>
      </div>

      {/* Budget List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-24">
        {/* Total Budget Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-5 mb-6 border border-white/5 shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <span className="font-semibold text-gray-200">Tổng ngân sách</span>
            <div className="flex flex-col items-end">
              <span className={remaining < 0 ? 'text-red-500 text-xs' : 'text-gray-400 text-xs'}>
                Còn lại: <span className={remaining < 0 ? 'text-red-500' : 'text-[#34c759]'}>{remaining.toLocaleString()}đ</span>
              </span>
              {totalBudget === 0 && (
                <button 
                  onClick={handleCopyFromLastMonth}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-[#3a3a3c] text-[#5ac8fa] text-[10px] font-bold rounded-full active:scale-95 transition-all"
                >
                  <Copy size={12} />
                  SAO CHÉP THÁNG TRƯỚC
                </button>
              )}
            </div>
          </div>
          <ProgressBar spent={totalSpent} budget={totalBudget || null} color="#ff9500" />
          <div className="flex justify-between mt-3 text-sm">
            <span className="text-gray-400 text-xs">
              Ngân sách {totalBudget > 0 ? totalBudget.toLocaleString() + 'đ' : 'Chưa đặt'}
            </span>
            <div className="text-right flex items-center gap-1">
              <span className="text-gray-400 font-medium text-xs">{totalBudget > 0 ? '100 %' : '-'}</span>
              <ChevronRight size={14} className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* Individual Budget Items */}
        <div className="space-y-1">
          {budgetItems.map((item) => {
            const itemRemaining = item.budget ? item.budget - item.spent : null;
            const percentage = item.budget ? Math.round((item.spent / item.budget) * 100) : null;
            const isOverBudget = item.budget ? item.spent > item.budget : false;

            return (
              <button 
                key={item.id} 
                className="w-full text-left py-4 border-b border-white/5 active:bg-white/5 transition-colors group"
                onClick={() => handleSetBudget(item.id, item.budget)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2c2c2e] flex items-center justify-center shadow-inner group-active:scale-95 transition-transform" style={{ color: item.color }}>
                      <Icon name={item.icon} size={20} />
                    </div>
                    <div>
                      <span className="font-semibold block">{item.name}</span>
                      <span className="text-xs text-gray-500">Chi tiêu {item.spent.toLocaleString()}đ</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {item.budget !== null ? (
                      <span className={isOverBudget ? 'text-red-500' : 'text-gray-400'}>
                        Còn: <span className={isOverBudget ? 'text-red-500 font-semibold' : 'text-white font-medium'}>{itemRemaining?.toLocaleString()}đ</span>
                      </span>
                    ) : (
                      <span className="text-gray-500 italic text-sm">Chưa thiết lập</span>
                    )}
                  </div>
                </div>
                <ProgressBar spent={item.spent} budget={item.budget} color={item.color} />
                <div className="flex justify-between mt-2.5 text-xs text-gray-500">
                  <span>
                    Ngân sách {item.budget ? item.budget.toLocaleString() + 'đ' : '-'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={isOverBudget ? 'text-red-500 font-bold' : ''}>
                      {percentage !== null ? `${percentage}%` : '-'}
                    </span>
                    <Edit2 size={12} className="text-gray-600" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Numpad Overlay */}
      {showNumpad && (
        <div
          className="absolute inset-0 bg-black/60 z-20 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowNumpad(false)}
        />
      )}

      {/* Numpad Container */}
      {showNumpad && (
        <div className="absolute left-0 right-0 bottom-0 bg-[#1c1c1e] z-30 animate-slide-up rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.5)] overflow-hidden">
          {/* Header for editing */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2c2c2e] flex items-center justify-center" style={{ color: editingItem?.color }}>
                <Icon name={editingItem?.icon || 'HelpCircle'} size={24} />
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider font-bold">Thiết lập ngân sách</span>
                <span className="font-semibold text-white">{editingItem?.name}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#5ac8fa]">
                {formatAmount(tempAmount)}
                <span className="ml-1 text-sm font-normal text-gray-500">đ</span>
                <span className="inline-block w-0.5 h-6 bg-[#5ac8fa] ml-1 align-middle animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex p-px gap-px bg-[#333]">
            {/* Main grid 3x4 */}
            <div className="flex-1 grid grid-cols-3 gap-px">
              <NumBtn k="7" /><NumBtn k="8" /><NumBtn k="9" />
              <NumBtn k="4" /><NumBtn k="5" /><NumBtn k="6" />
              <NumBtn k="1" /><NumBtn k="2" /><NumBtn k="3" />
              <NumBtn k="0" /><NumBtn k="00" /><div className="bg-[#2c2c2e]" />
            </div>

            {/* Right column */}
            <div className="w-20 flex flex-col gap-px ml-px">
              <NumBtn k="AC" color="text-gray-400" />
              <NumBtn k="Del" color="text-[#ff3b30]" />
              <button
                onClick={() => handleNumpadPress('OK')}
                className="bg-[#2c2c2e] flex-1 text-[#5ac8fa] text-xl font-bold active:bg-[#3a3a3c] transition-colors"
              >
                OK
              </button>
            </div>
          </div>

          {/* Safe area */}
          <div className="h-[env(safe-area-inset-bottom)] bg-[#1c1c1e]" />
        </div>
      )}
    </div>
  );
}
