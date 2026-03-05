import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Transaction, Budget, Category } from '../types';
import { syncToGoogleSheets, fetchFromGoogleSheets } from '../services/googleSheets';

interface TransactionState {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  currentUser: string | null;
  setCurrentUser: (name: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'synced' | 'createdBy'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'createdBy'>>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  fetchDataFromSheet: () => Promise<void>;
  getTransactionsByDate: (date: string) => Transaction[];
  getTotalsByDate: (date: string) => { income: number; expense: number };
  setBudget: (categoryId: string, amount: number, month: string) => void;
  getBudget: (categoryId: string, month: string) => number | null;
  copyBudgets: (fromMonth: string, toMonth: string) => Promise<void>;
  isFetching: boolean;
}

const INITIAL_CATEGORIES: Category[] = [
  // { id: '1', name: 'Ăn uống', icon: 'Utensils', color: '#ff9500', type: 'expense', order: 1 },
  // { id: '2', name: 'Chi tiêu hàng ngày', icon: 'ShoppingBag', color: '#ffcc00', type: 'expense', order: 2 },
  // { id: '3', name: 'Quần áo', icon: 'Shirt', color: '#34c759', type: 'expense', order: 3 },
  // { id: '4', name: 'Mỹ phẩm', icon: 'Sparkles', color: '#007aff', type: 'expense', order: 4 },
  // { id: '5', name: 'Phí giao lưu', icon: 'Users', color: '#5856d6', type: 'expense', order: 5 },
  // { id: '6', name: 'Y tế', icon: 'Heart', color: '#ff2d55', type: 'expense', order: 6 },
  // { id: '7', name: 'Giáo dục', icon: 'GraduationCap', color: '#af52de', type: 'expense', order: 7 },
  // { id: '8', name: 'Tiền điện', icon: 'Zap', color: '#f1c40f', type: 'expense', order: 8 },
  // { id: '9', name: 'Đi lại', icon: 'Car', color: '#3498db', type: 'expense', order: 9 },
  // { id: '10', name: 'Phí liên lạc', icon: 'Smartphone', color: '#9b59b6', type: 'expense', order: 10 },
  // { id: '11', name: 'Tiền nhà', icon: 'Home', color: '#e67e22', type: 'expense', order: 11 },
  // { id: 'inc_1', name: 'Tiền Lương', icon: 'Banknote', color: '#5ac8fa', type: 'income', order: 0 },
  // { id: 'inc_2', name: 'Tiền Affiliate', icon: 'TrendingUp', color: '#32def4', type: 'income', order: 1 },
  // { id: 'inc_3', name: 'Được cho', icon: 'Gift', color: '#ff2d55', type: 'income', order: 2 },
];

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      budgets: [],
      categories: INITIAL_CATEGORIES,
      currentUser: null,
      isFetching: false,
      setCurrentUser: (name) => set({ currentUser: name }),
      addTransaction: (tx) => {
        const user = get().currentUser || 'Người dùng';
        const newTransaction: Transaction = {
          ...tx,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          synced: false,
          createdBy: user,
        };
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));

        const category = get().categories.find(c => c.id === newTransaction.categoryId);
        const categoryName = category ? category.name : 'Khác';
        
        // Sync to Google Sheets
        syncToGoogleSheets({
          id: newTransaction.id,
          date: newTransaction.date,
          type: newTransaction.type,
          category: categoryName,
          categoryName: categoryName,
          amount: newTransaction.amount,
          note: newTransaction.note || '',
          createdBy: user,
          categoryId: newTransaction.categoryId,
          action: 'add',
        }).then(success => {
          if (success) {
            set((state) => ({
              transactions: state.transactions.map(t => 
                t.id === newTransaction.id ? { ...t, synced: true } : t
              )
            }));
          }
        });
      },
      updateTransaction: (id, updates) => {
        const transaction = get().transactions.find(t => t.id === id);
        if (!transaction) return;

        const updated: Transaction = { ...transaction, ...updates, synced: false };
        set((state) => ({
          transactions: state.transactions.map(t => t.id === id ? updated : t),
        }));

        const category = get().categories.find(c => c.id === updated.categoryId);
        const categoryName = category ? category.name : 'Khác';

        syncToGoogleSheets({
          id: updated.id,
          date: updated.date,
          type: updated.type,
          category: categoryName,
          categoryName: categoryName,
          amount: updated.amount,
          note: updated.note || '',
          createdBy: updated.createdBy,
          categoryId: updated.categoryId,
          action: 'update',
        }).then(success => {
          if (success) {
            set((state) => ({
              transactions: state.transactions.map(t =>
                t.id === id ? { ...t, synced: true } : t
              ),
            }));
          }
        });
      },
      deleteTransaction: (id) => {
        const transactionToDelete = get().transactions.find(t => t.id === id);
        
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));

        if (transactionToDelete) {
          const category = get().categories.find(c => c.id === transactionToDelete.categoryId);
          const categoryName = category ? category.name : 'Khác';
          
          syncToGoogleSheets({
            id: transactionToDelete.id,
            date: transactionToDelete.date,
            type: transactionToDelete.type,
            category: categoryName,
            categoryName: categoryName, // Send both for compatibility
            amount: transactionToDelete.amount,
            note: transactionToDelete.note || '',
            createdBy: transactionToDelete.createdBy,
            categoryId: transactionToDelete.categoryId, // Send explicit ID
            action: 'delete',
          });
        }
      },
      addCategory: (category) => {
        const newCategory: Category = {
          ...category,
          id: crypto.randomUUID(),
          synced: false,
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));

        // Sync to Google Sheets
        syncToGoogleSheets({
          id: newCategory.id,
          name: newCategory.name,
          icon: newCategory.icon,
          color: newCategory.color,
          type: newCategory.type,
          order: newCategory.order,
          action: 'add',
          dataType: 'category'
        }).then(success => {
          if (success) {
            set((state) => ({
              categories: state.categories.map(c => 
                c.id === newCategory.id ? { ...c, synced: true } : c
              )
            }));
          }
        });
      },
      updateCategory: (category) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === category.id ? { ...category, synced: false } : c)),
        }));

        // Sync to Google Sheets
        syncToGoogleSheets({
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: category.type,
          order: category.order,
          action: 'update',
          dataType: 'category'
        }).then(success => {
          if (success) {
            set((state) => ({
              categories: state.categories.map(c => 
                c.id === category.id ? { ...c, synced: true } : c
              )
            }));
          }
        });
      },
      deleteCategory: (id) => {
        const categoryToDelete = get().categories.find(c => c.id === id);
        
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));

        if (categoryToDelete) {
          // Sync deletion to Google Sheets
          syncToGoogleSheets({
            id: categoryToDelete.id,
            name: categoryToDelete.name,
            icon: categoryToDelete.icon,
            color: categoryToDelete.color,
            type: categoryToDelete.type,
            order: categoryToDelete.order,
            action: 'delete',
            dataType: 'category'
          });
        }
      },
      fetchDataFromSheet: async () => {
        if (get().isFetching) {
          console.log('--- FETCH ALREADY IN PROGRESS, SKIP ---');
          return;
        }

        try {
          set({ isFetching: true });
          console.log('--- [START] FETCH FROM SHEET ---');
          const remoteData = await fetchFromGoogleSheets();
          console.log('1. RAW DATA FROM SHEET:', remoteData);
          
          if (Array.isArray(remoteData)) {
            const categories = get().categories;
            const REVERSE_CATEGORY_NAMES: Record<string, string> = {};
            categories.forEach(c => {
              REVERSE_CATEGORY_NAMES[c.name.normalize('NFC')] = c.id;
            });

            const formattedTransactions: Transaction[] = [];
            const formattedBudgets: Budget[] = [];
            const formattedCategories: Category[] = [];

            remoteData.forEach((item: any, index: number) => {
              const normalizedItem: any = {};
              Object.keys(item).forEach(key => {
                normalizedItem[key.toLowerCase()] = item[key];
              });

              const rawCatName = (normalizedItem.categoryname || normalizedItem.category || 'Khác').toString();
              const catName = rawCatName.trim().normalize('NFC');
              
              // Prioritize name-based mapping if it's a known category name
              // This ensures "Y tế" or "Ăn uống" are grouped correctly even if the sheet ID is "default"
              let catId = REVERSE_CATEGORY_NAMES[catName];
              if (!catId) {
                catId = (normalizedItem.categoryid || 'default').toString();
              }

              if (normalizedItem.datatype === 'category') {
                const catObj: Category = {
                  id: normalizedItem.id || crypto.randomUUID(),
                  name: normalizedItem.name || normalizedItem.category || 'Không tên',
                  icon: normalizedItem.icon || 'HelpCircle',
                  color: normalizedItem.color || '#cccccc',
                  type: (normalizedItem.type as any) || 'expense',
                  order: Number(normalizedItem.order) || 0,
                  synced: true,
                };
                formattedCategories.push(catObj);
              } else if (normalizedItem.datatype === 'budget' || (normalizedItem.month && !normalizedItem.date)) {
                // Robust month normalization - Fix Timezone Shift
                let normalizedMonth = '';
                const rawMonth = (normalizedItem.month || '').toString();
                
                const d = new Date(rawMonth);
                if (!isNaN(d.getTime())) {
                  // Use local time getter to respect Vietnam timezone (GMT+7)
                  normalizedMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                } else if (rawMonth.match(/^\d{4}-\d{2}/)) {
                  normalizedMonth = rawMonth.substring(0, 7);
                } else {
                  normalizedMonth = rawMonth;
                }

                // Parse amount
                let amount = 0;
                const rawAmount = normalizedItem.amount;
                if (typeof rawAmount === 'number') amount = rawAmount;
                else if (typeof rawAmount === 'string') {
                  if (rawAmount.includes('-') && rawAmount.includes('T')) {
                    const d = new Date(rawAmount);
                    const epoch = new Date('1899-12-30').getTime();
                    amount = Math.round((d.getTime() - epoch) / (24 * 60 * 60 * 1000));
                  } else {
                    amount = Number(rawAmount.replace(/[^-0.9]/g, ''));
                  }
                }

                const budgetObj = {
                  id: normalizedItem.id || crypto.randomUUID(),
                  categoryId: catId,
                  amount: isNaN(amount) ? 0 : amount,
                  month: normalizedMonth,
                  synced: true,
                };
                console.log(`2. PROCESSED BUDGET [${index}]:`, budgetObj);
                formattedBudgets.push(budgetObj);
              } else {
                let amount = Number(normalizedItem.amount);
                
                // Fix timezone shift for transaction dates as well
                let txDate = normalizedItem.date;
                const d = new Date(txDate);
                if (!isNaN(d.getTime())) {
                  txDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                }

                const txObj: Transaction = {
                  id: normalizedItem.id || crypto.randomUUID(),
                  date: txDate,
                  type: normalizedItem.type as any,
                  amount: isNaN(amount) ? 0 : amount,
                  categoryId: catId,
                  walletId: 'default',
                  note: normalizedItem.note || '',
                  createdBy: normalizedItem.createdby || 'Người dùng',
                  synced: true,
                  createdAt: (() => {
                    const raw = normalizedItem.createdat;
                    if (!raw) return Date.now();
                    if (typeof raw === 'number') return raw;
                    const parsed = new Date(raw);
                    return isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
                  })(),
                };
                formattedTransactions.push(txObj);
              }
            });

            set((state) => {
              const unsyncedTxIds = new Set(state.transactions.filter(t => t.synced === false).map(t => t.id));
              const newTransactions = state.transactions.filter(t => t.synced === false);
              formattedTransactions.forEach(rt => {
                if (!unsyncedTxIds.has(rt.id)) newTransactions.push(rt);
              });
              newTransactions.sort((a, b) => {
                const dateCompare = b.date.localeCompare(a.date);
                if (dateCompare !== 0) return dateCompare;
                return (b.createdAt || 0) - (a.createdAt || 0);
              });

              const dirtyBudgets = state.budgets.filter(b => b.synced === false);
              const newBudgets = [...formattedBudgets];
              dirtyBudgets.forEach(db => {
                const remoteIdx = newBudgets.findIndex(rb => rb.categoryId === db.categoryId && rb.month === db.month);
                if (remoteIdx > -1) newBudgets[remoteIdx] = db;
                else newBudgets.push(db);
              });

              console.log('3. FINAL STATE - TXs:', newTransactions.length, 'Budgets:', newBudgets.length, 'Categories:', formattedCategories.length);
              console.log('--- [END] FETCH FROM SHEET ---');
              
              const finalState: Partial<TransactionState> = { 
                transactions: newTransactions, 
                budgets: newBudgets 
              };

              if (formattedCategories.length > 0) {
                const sheetIds = new Set(formattedCategories.map(c => c.id));
                const dirtyLocalCategories = state.categories.filter(c => c.synced === false && !sheetIds.has(c.id));
                finalState.categories = [...formattedCategories, ...dirtyLocalCategories];
              }

              return finalState as any;
            });
          }
        } catch (error) {
          console.error('!!! ERROR IN FETCH DATA:', error);
        } finally {
          set({ isFetching: false });
        }
      },
      getTransactionsByDate: (date) => {
        return get().transactions.filter((t) => t.date === date);
      },
      getTotalsByDate: (date) => {
        const dayTransactions = get().transactions.filter((t) => t.date === date);
        return dayTransactions.reduce(
          (acc, curr) => {
            if (curr.type === 'income') acc.income += curr.amount;
            else acc.expense += curr.amount;
            return acc;
          },
          { income: 0, expense: 0 }
        );
      },
      setBudget: (categoryId, amount, month) => {
        const category = get().categories.find(c => c.id === categoryId);
        const categoryName = category ? category.name : 'Khác';
        let budgetId: string = crypto.randomUUID();

        set((state) => {
          const existingIndex = state.budgets.findIndex(
            (b) => b.categoryId === categoryId && b.month === month
          );
          
          if (existingIndex > -1) {
            budgetId = state.budgets[existingIndex].id;
            const newBudgets = [...state.budgets];
            newBudgets[existingIndex] = { 
              ...newBudgets[existingIndex], 
              amount,
              synced: false // Mark as unsynced immediately
            };
            return { budgets: newBudgets };
          }
          
          return {
            budgets: [
              ...state.budgets,
              { id: budgetId, categoryId, amount, month, synced: false },
            ],
          };
        });

        // Sync budget to Google Sheets
        syncToGoogleSheets({
          id: budgetId,
          month,
          category: categoryName,
          categoryName: categoryName,
          categoryId: categoryId, // Send explicit ID
          amount: amount,
          action: 'update',
          dataType: 'budget'
        }).then(success => {
          if (success) {
            set((state) => ({
              budgets: state.budgets.map(b => 
                b.id === budgetId ? { ...b, synced: true } : b
              )
            }));
          }
        });
      },
      getBudget: (categoryId, month) => {
        const budget = get().budgets.find(
          (b) => b.categoryId === categoryId && b.month === month
        );
        return budget ? budget.amount : null;
      },
      copyBudgets: async (fromMonth, toMonth) => {
        const budgetsToCopy = get().budgets.filter(b => b.month === fromMonth);
        if (budgetsToCopy.length === 0) return;

        // For each budget from previous month
        for (const b of budgetsToCopy) {
          // Skip if target month already has a budget for this category
          const existing = get().budgets.find(tb => tb.month === toMonth && tb.categoryId === b.categoryId);
          if (existing && existing.amount > 0) continue;
          
          get().setBudget(b.categoryId, b.amount, toMonth);
        }
      },
    }),
    {
      name: 'finance-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Exclude isFetching from persistence to prevent it from getting stuck as true
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isFetching, ...rest } = state;
        return rest as typeof state;
      },
    }
  )
);
