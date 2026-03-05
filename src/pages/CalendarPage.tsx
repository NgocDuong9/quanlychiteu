import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, AlertTriangle } from 'lucide-react';
import { useTransactionStore } from '../stores/useTransactionStore';
import { Icon } from '../components/ui/Icon';
import { SwipeableTransactionItem } from '../components/ui/SwipeableTransactionItem';
import { EditTransactionModal } from '../components/ui/EditTransactionModal';
import type { Transaction } from '../types';

type ViewMode = 'full' | 'compact';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { transactions, categories, deleteTransaction } = useTransactionStore();

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Use memo to calculate totals for each day in the current month view
  const dayStats = useMemo(() => {
    const stats: Record<string, { income: number; expense: number }> = {};
    
    // Format: YYYY-MM
    const currentMonthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    
    transactions.forEach(tx => {
      if (tx.date.startsWith(currentMonthStr)) {
        if (!stats[tx.date]) stats[tx.date] = { income: 0, expense: 0 };
        if (tx.type === 'income') stats[tx.date].income += tx.amount;
        else stats[tx.date].expense += tx.amount;
      }
    });
    
    return stats;
  }, [transactions, year, month]);

  const monthlySummary = useMemo(() => {
    return Object.values(dayStats).reduce(
      (acc, curr) => {
        acc.income += curr.income;
        acc.expense += curr.expense;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [dayStats]);

  const transactionsForMonth = useMemo(() => {
    const currentMonthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    return transactions
      .filter(tx => tx.date.startsWith(currentMonthStr))
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [transactions, year, month]);

  // First day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay(); // 0 = Sunday

  // Get days from previous month to fill the grid
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Navigate months
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  // Format month header
  const formatMonthHeader = () => {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const startDate = `01/${monthStr}`;
    const endDate = `${daysInMonth}/${monthStr}`;
    return {
      main: `${monthStr}/${year}`,
      range: `(${startDate}-${endDate})`,
    };
  };

  // Days of week header (Monday first, Vietnamese style)
  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  // Generate calendar grid
  const generateCalendarDays = () => {
    const days = [];

    // Adjust starting day (convert Sunday = 0 to Monday = 0)
    const adjustedStartDay = startingDay === 0 ? 6 : startingDay - 1;

    // Previous month days
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isWeekend: false,
        fullDate: '',
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      days.push({
        day,
        isCurrentMonth: true,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isSaturday: dayOfWeek === 6,
        isSunday: dayOfWeek === 0,
        fullDate: dateStr,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isWeekend: false,
        fullDate: '',
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const { main, range } = formatMonthHeader();

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header: Title + Month Selector + View Toggle */}
      <div className="flex items-center justify-between px-4 py-3 gap-2">
        <h1 className="text-lg font-bold text-white w-10 shrink-0">Lịch</h1>

        <div className="flex items-center gap-1 flex-1 justify-center">
          <button onClick={() => changeMonth(-1)} className="p-1.5">
            <ChevronLeft size={18} className="text-gray-400" />
          </button>
          <div className="bg-[#1c1c1e] px-4 py-1.5 rounded-xl text-center border border-[#333]">
            <span className="text-sm text-white font-bold">{main}</span>
            {viewMode === 'full' && <span className="text-gray-500 text-[10px] ml-1.5">{range}</span>}
          </div>
          <button onClick={() => changeMonth(1)} className="p-1.5">
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="flex bg-[#1c1c1e] rounded-lg p-0.5 border border-[#333] shrink-0">
          <button
            onClick={() => setViewMode('full')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'full' ? 'bg-[#3a3a3c] text-[#5ac8fa]' : 'text-gray-500'}`}
          >
            <CalendarIcon size={18} />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'compact' ? 'bg-[#3a3a3c] text-[#5ac8fa]' : 'text-gray-500'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid - Only show in full view */}
      {viewMode === 'full' && (
        <div className="px-4 py-2 animate-fade-in">
          {/* Days of week header */}
          <div className="grid grid-cols-7 mb-1">
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                className={`text-center py-1 text-[10px] font-bold uppercase tracking-widest ${
                  index === 5
                    ? 'text-[#5ac8fa]'
                    : index === 6
                    ? 'text-[#ff3b30]'
                    : 'text-gray-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-px bg-[#222] border border-[#222] rounded-lg overflow-hidden">
            {calendarDays.map((dayInfo, index) => {
              const stats = dayInfo.fullDate ? dayStats[dayInfo.fullDate] : null;
              return (
                <div
                  key={index}
                  className={`relative py-1 h-12 flex flex-col items-center justify-start bg-black transition-all ${
                    !dayInfo.isCurrentMonth
                      ? 'opacity-10 pointer-events-none'
                      : dayInfo.isSunday
                      ? 'text-[#ff3b30]'
                      : dayInfo.isSaturday
                      ? 'text-[#5ac8fa]'
                      : 'text-white'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${dayInfo.fullDate === new Date().toISOString().split('T')[0] ? 'bg-[#5ac8fa] text-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-[#5ac8fa]/20' : ''}`}>
                    {dayInfo.day}
                  </span>
                  <div className="w-full flex flex-col items-center px-0.5 gap-px mt-0.5">
                    {stats && stats.income > 0 && (
                      <div className="text-[7px] font-black text-[#5ac8fa] leading-none truncate w-full text-center bg-[#5ac8fa]/10 py-px rounded-[2px]">
                        +{stats.income >= 1000 ? `${Math.floor(stats.income/1000)}k` : stats.income}
                      </div>
                    )}
                    {stats && stats.expense > 0 && (
                      <div className="text-[7px] font-black text-[#ff453a] leading-none truncate w-full text-center bg-[#ff453a]/10 py-px rounded-[2px]">
                        -{stats.expense >= 1000 ? `${Math.floor(stats.expense/1000)}k` : stats.expense}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className={`grid grid-cols-3 gap-2 px-3 py-3 bg-[#1c1c1e] mx-4 rounded-2xl border border-[#333] shadow-xl ${viewMode === 'full' ? 'mt-2' : 'mt-4'}`}>
        <div className="text-center">
          <div className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 font-bold">Thu nhập</div>
          <div className="text-[#5ac8fa] font-bold text-xs">{monthlySummary.income.toLocaleString()}đ</div>
        </div>
        <div className="text-center border-x border-[#333]">
          <div className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 font-bold">Chi tiêu</div>
          <div className="text-[#ff453a] font-bold text-xs">{monthlySummary.expense.toLocaleString()}đ</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 font-bold">Tổng</div>
          <div className={`font-bold text-xs ${monthlySummary.income - monthlySummary.expense >= 0 ? 'text-[#5ac8fa]' : 'text-[#ff453a]'}`}>
            {(monthlySummary.income - monthlySummary.expense).toLocaleString()}đ
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 min-h-0 custom-scrollbar"
        onClick={() => setOpenSwipeId(null)}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Giao dịch trong tháng</h3>
          <span className="text-[10px] text-gray-600 font-bold">{transactionsForMonth.length} mục</span>
        </div>
        {transactionsForMonth.length === 0 ? (
          <div className="text-center py-12 bg-[#1c1c1e]/30 rounded-2xl border border-dashed border-[#333]">
            <div className="opacity-20 mb-2 flex justify-center text-gray-500">
              <CalendarIcon size={40} />
            </div>
            <p className="text-xs text-gray-500 italic">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactionsForMonth.map((tx) => {
              const category = categories.find(c => c.id === tx.categoryId);
              return (
                <SwipeableTransactionItem
                  key={tx.id}
                  isOpen={openSwipeId === tx.id}
                  onOpen={() => setOpenSwipeId(tx.id)}
                  onClose={() => setOpenSwipeId(null)}
                  onEdit={() => {
                    setOpenSwipeId(null);
                    setEditingTransaction(tx);
                  }}
                  onDelete={() => {
                    setOpenSwipeId(null);
                    setDeleteConfirmId(tx.id);
                  }}
                >
                  <div className="flex items-center justify-between p-3.5 bg-[#1c1c1e] rounded-2xl border border-[#333]">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center border border-[#333] shadow-inner"
                        style={{ backgroundColor: `${category?.color || '#333'}22`, color: category?.color || '#8e8e93' }}
                      >
                        <Icon name={category?.icon || 'Wallet'} size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{tx.note || category?.name || 'Khác'}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 font-medium flex items-center gap-2">
                          <span>{tx.date}</span>
                          <span className="w-1 h-1 bg-[#333] rounded-full"></span>
                          <span className="text-[#5ac8fa] opacity-80">{tx.createdBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-black ${tx.type === 'income' ? 'text-[#5ac8fa]' : 'text-[#ff453a]'}`}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}đ
                    </div>
                  </div>
                </SwipeableTransactionItem>
              );
            })}
          </div>
        )}
      </div>

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-[#2c2c2e] rounded-2xl w-full max-w-xs border border-[#444] overflow-hidden animate-fade-in">
            <div className="flex flex-col items-center px-5 pt-5 pb-4 gap-2">
              <div className="w-12 h-12 rounded-full bg-[#ff453a]/15 flex items-center justify-center mb-1">
                <AlertTriangle size={22} className="text-[#ff453a]" />
              </div>
              <span className="text-white font-bold text-base">Xóa giao dịch?</span>
              <span className="text-gray-400 text-sm text-center">Hành động này không thể hoàn tác.</span>
            </div>
            <div className="flex border-t border-[#444]">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3.5 text-white text-sm font-medium border-r border-[#444] active:bg-[#3a3a3c] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  deleteTransaction(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-3.5 text-[#ff453a] text-sm font-bold active:bg-[#3a3a3c] transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
