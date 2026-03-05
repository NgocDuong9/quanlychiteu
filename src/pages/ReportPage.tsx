import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { useTransactionStore } from '../stores/useTransactionStore';

type ViewMode = 'monthly' | 'yearly';
type TabType = 'expense' | 'income';

export default function ReportPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, _setSearchQuery] = useState('');

  const { transactions, categories } = useTransactionStore();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigate
  const navigateDate = (delta: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'monthly') {
      newDate.setMonth(newDate.getMonth() + delta);
    } else {
      newDate.setFullYear(newDate.getFullYear() + delta);
    }
    setCurrentDate(newDate);
    setExpandedCategory(null);
  };

  // Filter transactions based on viewMode and date
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      if (viewMode === 'monthly') {
        return txDate.getFullYear() === year && txDate.getMonth() === month;
      } else {
        return txDate.getFullYear() === year;
      }
    });
  }, [transactions, year, month, viewMode]);

  // Group by category for the active tab
  const categorySummary = useMemo(() => {
    const summary: Record<string, { id: string; name: string; icon: string; amount: number; color: string }> = {};
    let total = 0;

    filteredTransactions
      .filter(tx => tx.type === activeTab)
      .forEach(tx => {
        const catId = tx.categoryId;
        if (!summary[catId]) {
          const category = categories.find(c => c.id === catId);
          summary[catId] = {
            id: catId,
            name: category ? category.name : 'Khác',
            icon: category ? category.icon : 'Wallet',
            amount: 0,
            color: category ? category.color : '#8e8e93',
          };
        }
        summary[catId].amount += tx.amount;
        total += tx.amount;
      });

    const items = Object.values(summary).sort((a, b) => b.amount - a.amount);
    return {
      items: items.map(item => ({
        ...item,
        percentage: total > 0 ? parseFloat(((item.amount / total) * 100).toFixed(1)) : 0
      })),
      total
    };
  }, [filteredTransactions, activeTab]);

  const formatHeader = () => {
    if (viewMode === 'yearly') return { main: `${year}`, range: '' };
    const monthStr = (month + 1).toString().padStart(2, '0');
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return {
      main: `${monthStr}/${year}`,
      range: `(01/${monthStr}-${daysInMonth}/${monthStr})`,
    };
  };

  const { main, range } = formatHeader();

  const tabColor = activeTab === 'expense' ? '#ff453a' : '#5ac8fa';

  const DonutChart = () => {
    let cumulativePercentage = 0;
    return (
      <div className="relative w-52 h-52 mx-auto my-4">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          {categorySummary.items.map((item, index) => {
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -(cumulativePercentage / 100) * circumference;

            cumulativePercentage += item.percentage;

            return (
              <circle
                key={index}
                cx="50" cy="50" r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="14"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                className="transition-all duration-700 ease-in-out"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[10px] uppercase tracking-[0.15em] mb-0.5" style={{ color: tabColor }}>
            {activeTab === 'expense' ? 'CHI TIÊU' : 'THU NHẬP'}
          </div>
          <div className="text-xl font-bold text-white tabular-nums">
            {categorySummary.total.toLocaleString()}đ
          </div>
        </div>
      </div>
    );
  };

  // User breakdown data
  const userBreakdown = useMemo(() => {
    const userTotals: Record<string, number> = {};
    filteredTransactions.filter(tx => tx.type === activeTab).forEach(tx => {
      const user = tx.createdBy || 'Người dùng';
      userTotals[user] = (userTotals[user] || 0) + tx.amount;
    });
    const total = Object.values(userTotals).reduce((a, b) => a + b, 0);
    return {
      entries: Object.entries(userTotals).sort((a, b) => b[1] - a[1]),
      total,
      count: Object.keys(userTotals).length
    };
  }, [filteredTransactions, activeTab]);

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Sticky Header Zone */}
      <div className="flex-shrink-0" style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04)' }}>
        {/* View toggle + Date navigator */}
        <div className="px-4 pt-3 pb-0 flex flex-col items-center gap-2">
          <div className="flex bg-[#1c1c1e] rounded-full p-0.5 border border-[#333]">
            {(['monthly', 'yearly'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  setExpandedCategory(null);
                }}
                className={`px-5 py-1 rounded-full text-xs font-semibold transition-all ${
                  viewMode === mode ? 'bg-[#3a3a3c] text-white' : 'text-gray-500'
                }`}
              >
                {mode === 'monthly' ? 'Hàng Tháng' : 'Hàng Năm'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigateDate(-1)} className="text-gray-400 p-1.5 active:opacity-50">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center min-w-[110px]">
              <div className="text-base text-white font-bold leading-tight">{main}</div>
              {range && <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{range}</div>}
            </div>
            <button onClick={() => navigateDate(1)} className="text-gray-400 p-1.5 active:opacity-50">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#222] mx-4">
          {(['expense', 'income'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setExpandedCategory(null);
              }}
              className={`flex-1 py-2.5 text-center text-sm font-bold border-b-2 transition-all ${
                activeTab !== tab ? 'text-gray-500 border-transparent' : ''
              }`}
              style={activeTab === tab ? {
                color: tab === 'expense' ? '#ff453a' : '#5ac8fa',
                borderBottomColor: tab === 'expense' ? '#ff453a' : '#5ac8fa',
              } : undefined}
            >
              {tab === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      {categorySummary.items.length > 0 ? (
        <div className="flex-1 overflow-y-auto animate-fade-in" key={`${activeTab}-${viewMode}-${month}-${year}`}>
          <DonutChart />

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-6 mb-4">
            {categorySummary.items.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-gray-400 truncate max-w-[80px]">{item.name}</span>
                <span className="text-[10px] text-gray-600">{item.percentage}%</span>
              </div>
            ))}
            {categorySummary.items.length > 6 && (
              <span className="text-[10px] text-gray-600">+{categorySummary.items.length - 6} khác</span>
            )}
          </div>

          {/* User Breakdown Section */}
          {userBreakdown.count > 1 && (
            <div className="px-4 mb-5">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-bold px-1 flex items-center gap-2">
                <span className="w-1 h-3 rounded-full" style={{ backgroundColor: tabColor }}></span>
                Phân bổ theo thành viên
              </div>
              <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-[#333] space-y-4">
                {(() => {
                  const colors = ['#5ac8fa', '#ffcc00', '#34c759', '#ff2d55', '#af52de'];
                  return userBreakdown.entries.map(([name, amount], idx) => {
                    const percentage = userBreakdown.total > 0 ? (amount / userBreakdown.total) * 100 : 0;
                    return (
                      <div key={name} className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-medium text-gray-300">{name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600">{percentage.toFixed(0)}%</span>
                            <span className="text-[11px] font-bold text-white">{amount.toLocaleString()}đ</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colors[idx % colors.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Category Details */}
          <div className="px-4 pb-6 space-y-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2">
                <span className="w-1 h-3 rounded-full" style={{ backgroundColor: tabColor }}></span>
                {activeTab === 'expense' ? 'Chi tiết chi tiêu' : 'Chi tiết thu nhập'}
              </div>
            </div>
            {categorySummary.items
              .filter(item => {
                if (!searchQuery.trim()) return true;
                const terms = searchQuery.toLowerCase().split(/[,,;]/).map(t => t.trim()).filter(t => t);
                const matchesName = terms.some(term => item.name.toLowerCase().includes(term));
                if (matchesName) return true;
                const hasMatchingNote = filteredTransactions.some(tx =>
                  tx.categoryId === item.id &&
                  tx.type === activeTab &&
                  terms.some(term => (tx.note || '').toLowerCase().includes(term))
                );
                return hasMatchingNote;
              })
              .map((item) => {
              const isExpanded = expandedCategory === item.id;
              const transactionsInCat = filteredTransactions
                .filter(tx => tx.categoryId === item.id && tx.type === activeTab)
                .sort((a, b) => {
                  const dateCompare = b.date.localeCompare(a.date);
                  if (dateCompare !== 0) return dateCompare;
                  return (b.createdAt || 0) - (a.createdAt || 0);
                });

              return (
                <div key={item.id} className="overflow-hidden bg-[#1c1c1e]/30 rounded-xl border border-[#222]">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between p-4 active:bg-[#2c2c2e] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center border border-[#333] shadow-inner" style={{ color: item.color }}>
                        <Icon name={item.icon} size={20} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">{item.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{item.percentage}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: tabColor }}>
                        {item.amount.toLocaleString()}đ
                      </span>
                      <ChevronRight
                        size={14}
                        className={`text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-[#222] bg-black/20 animate-slide-down">
                      <div className="pt-2">
                        {transactionsInCat.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex justify-between items-center py-2.5 border-b border-[#333]/50 last:border-0"
                          >
                            <div>
                              <div className="text-xs text-white font-medium">{tx.note || (activeTab === 'expense' ? 'Chi tiêu' : 'Thu nhập')}</div>
                              <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                <span>{tx.date}</span>
                                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                <span className="text-[#5ac8fa] font-medium">{tx.createdBy}</span>
                              </div>
                            </div>
                            <div className={`text-xs font-semibold ${activeTab === 'expense' ? 'text-white' : 'text-[#5ac8fa]'}`}>
                              {activeTab === 'expense' ? '-' : '+'}{tx.amount.toLocaleString()}đ
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-12">
          <div className="mb-4 opacity-20">
            <Icon name="BarChart3" size={64} />
          </div>
          <div className="text-sm italic">Không có dữ liệu cho giai đoạn này</div>
        </div>
      )}
    </div>
  );
}
