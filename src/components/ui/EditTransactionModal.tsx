import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { Icon } from './Icon';
import type { Transaction } from '../../types';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

export function EditTransactionModal({ transaction, onClose }: Props) {
  const { categories, updateTransaction } = useTransactionStore();
  const [type, setType] = useState<'expense' | 'income'>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [selectedCategory, setSelectedCategory] = useState(transaction.categoryId);
  const [date, setDate] = useState(transaction.date);
  const [note, setNote] = useState(transaction.note || '');

  const filteredCategories = categories.filter(c => c.type === type);

  useEffect(() => {
    const firstCat = filteredCategories.find(c => c.id === selectedCategory);
    if (!firstCat && filteredCategories.length > 0) {
      setSelectedCategory(filteredCategories[0].id);
    }
  }, [type]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} (${days[d.getDay()]})`;
  };

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d > today) return;
    setDate(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`);
  };

  const isNextDateDisabled = () => {
    const d = new Date(date + 'T00:00:00');
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const handleSave = () => {
    const numAmount = parseInt(amount.replace(/[^\d]/g, ''));
    if (!numAmount || !selectedCategory) return;
    updateTransaction(transaction.id, { type, amount: numAmount, categoryId: selectedCategory, date, note });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-[#1c1c1e] rounded-t-3xl overflow-y-auto border-t border-[#333] animate-slide-up"
        style={{ maxHeight: '90dvh' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#555] rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-white font-bold text-base">Sửa giao dịch</span>
          <button onClick={onClose} className="p-1.5 rounded-full bg-[#3a3a3c] active:opacity-70">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="px-4 py-2">
          <div className="flex bg-[#2c2c2e] rounded-full p-0.5">
            <button
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 rounded-full text-sm font-medium transition-all ${type === 'expense' ? 'bg-[#3a3a3c] text-white' : 'text-gray-400'}`}
            >
              Tiền chi
            </button>
            <button
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 rounded-full text-sm font-medium transition-all ${type === 'income' ? 'bg-[#3a3a3c] text-white' : 'text-gray-400'}`}
            >
              Tiền thu
            </button>
          </div>
        </div>

        <div className="flex items-center px-4 py-1.5 gap-3">
          <span className="text-gray-400 text-sm w-16 shrink-0">Ngày</span>
          <div className="flex items-center flex-1 gap-1">
            <button onClick={() => changeDate(-1)} className="p-1">
              <ChevronLeft size={16} className="text-gray-400" />
            </button>
            <div className="flex-1 bg-[#2c2c2e] px-3 py-2 rounded-lg text-center">
              <span className="text-white text-sm">{formatDate(date)}</span>
            </div>
            <button onClick={() => changeDate(1)} disabled={isNextDateDisabled()} className="p-1 disabled:opacity-30">
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center px-4 py-1.5 gap-3">
          <span className="text-gray-400 text-sm w-16 shrink-0">Số tiền</span>
          <div className="flex-1 flex items-center gap-2 bg-[#2c2c2e] px-3 py-2 rounded-lg">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputMode="numeric"
              className="flex-1 bg-transparent text-white text-sm outline-none"
              placeholder="0"
            />
            <span className="text-gray-400 text-sm">đ</span>
          </div>
        </div>

        <div className="flex items-center px-4 py-1.5 gap-3">
          <span className="text-gray-400 text-sm w-16 shrink-0">Ghi chú</span>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Chưa nhập vào"
            className="flex-1 bg-[#2c2c2e] px-3 py-2 rounded-lg text-white text-sm outline-none placeholder:text-gray-600"
          />
        </div>

        <div className="px-4 pt-3 pb-2">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Danh mục</span>
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center py-2 rounded-lg transition-all active:scale-95 ${selectedCategory === cat.id ? 'bg-[#3a3a3c] ring-1 ring-gray-500' : 'bg-[#2c2c2e]'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform ${selectedCategory === cat.id ? 'scale-110' : ''}`}
                  style={{
                    backgroundColor: selectedCategory === cat.id ? cat.color : `${cat.color}22`,
                    color: selectedCategory === cat.id ? 'white' : cat.color,
                  }}
                >
                  <Icon name={cat.icon} size={20} />
                </div>
                <span className="text-[10px] text-white truncate w-full text-center px-1">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-[#0a84ff] rounded-xl text-white font-bold text-base active:opacity-80 transition-opacity"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
