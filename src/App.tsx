import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import InputPage from './pages/InputPage';
import CalendarPage from './pages/CalendarPage';
import ReportPage from './pages/ReportPage';
import BudgetPage from './pages/BudgetPage';
import SettingsPage from './pages/SettingsPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import SplashScreen from './components/SplashScreen';
import { useEffect, useState, useCallback } from 'react';
import { useTransactionStore } from './stores/useTransactionStore';

function App() {
  const fetchDataFromSheet = useTransactionStore((state) => state.fetchDataFromSheet);
  const { currentUser, setCurrentUser } = useTransactionStore();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    // Check if user set
    if (!currentUser) {
      const names = ['Phương', 'Dương', 'Khác'];
      const defaultName = names[0];
      const savedName = localStorage.getItem('user-profile-name');

      if (savedName) {
        setCurrentUser(savedName);
      } else {
        const name = prompt('Chào mừng! Vui lòng cho biết tên của bạn:', defaultName);
        const finalName = name || defaultName;
        setCurrentUser(finalName);
        localStorage.setItem('user-profile-name', finalName);
      }
    }

    // Initial fetch
    fetchDataFromSheet();

    // Set up 1 minute interval (60000ms)
    const intervalId = setInterval(() => {
      console.log('Periodic sync with Google Sheets...');
      fetchDataFromSheet();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchDataFromSheet, currentUser, setCurrentUser]);

  if (showSplash) {
    return <SplashScreen onFinished={handleSplashFinished} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<InputPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="categories" element={<CategoryManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
