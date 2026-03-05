
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwV7QgKnbXTtqonyClBYzDmIF_MGJSkaXAOu5ySBtSLx8ltDLdESHGfYRaIJvkLH7zl/exec'.trim();

export interface SheetTransaction {
  id: string;
  date: string;
  type: 'expense' | 'income';
  category: string;
  categoryName?: string; // Added for compatibility
  amount: number;
  note: string;
  createdBy?: string;
  categoryId?: string;
  action?: 'add' | 'update' | 'delete';
  dataType?: 'transaction';
}

export interface SheetBudget {
  id: string;
  month: string;
  category: string;
  categoryName?: string;
  categoryId: string; // Thêm trường này
  amount: number;
  action?: 'add' | 'update' | 'delete';
  dataType: 'budget';
}

export interface SheetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  order: number;
  action?: 'add' | 'update' | 'delete';
  dataType: 'category';
}

export const fetchFromGoogleSheets = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return [];
  try {
    const response = await fetch(SCRIPT_URL);
    return await response.json();
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return [];
  }
};

export const syncToGoogleSheets = async (data: SheetTransaction | SheetBudget | SheetCategory) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return false;

  try {
    const payload = {
      ...data,
      action: data.action || 'add',
      dataType: (data as any).dataType || ('date' in data ? 'transaction' : ('month' in data ? 'budget' : 'category'))
    };

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return false;
  }
};
