import React from 'react';
import { ChevronRight, FolderOpen, User, Trash2, RefreshCw } from 'lucide-react';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useNavigate } from 'react-router-dom';

interface SettingItem {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  color?: string;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, fetchDataFromSheet, isFetching } = useTransactionStore();

  const handleUpdateName = () => {
    const newName = prompt('Nhập tên mới của bạn:', currentUser || '');
    if (newName && newName.trim()) {
      setCurrentUser(newName.trim());
      localStorage.setItem('user-profile-name', newName.trim());
      alert('Đã cập nhật tên thành công!');
    }
  };

  const handleResetData = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu trên thiết bị? (Dữ liệu trên Google Sheet sẽ không bị ảnh hưởng)')) {
      localStorage.removeItem('finance-storage');
      window.location.reload();
    }
  };

  const settingItems: SettingItem[] = [
    {
      icon: <User size={22} className="text-[#5ac8fa]" />,
      label: 'Đổi tên người dùng',
      description: `Hiện tại: ${currentUser || 'Chưa đặt'}`,
      onClick: handleUpdateName,
    },
    {
      icon: <FolderOpen size={22} className="text-[#ffcc00]" />,
      label: 'Quản lý danh mục',
      description: 'Tùy chỉnh danh mục chi tiêu/thu nhập',
      onClick: () => navigate('/categories'),
    },
    {
      icon: <Trash2 size={22} className="text-[#ff453a]" />,
      label: 'Xóa dữ liệu máy',
      description: 'Reset ứng dụng về trạng thái đầu',
      onClick: handleResetData,
      color: 'text-[#ff453a]'
    },
  ];

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-[#222]">
        <h1 className="text-lg font-bold">Cài đặt</h1>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-4 py-2">
          {settingItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center justify-between py-5 border-b border-[#222] active:bg-[#1c1c1e] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1c1c1e] flex items-center justify-center border border-[#333]">
                  {item.icon}
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${item.color || 'text-white'}`}>{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-700" />
            </button>
          ))}
        </div>

        {/* Sync Status Section */}
        <div className="mx-4 mt-8 mb-10 overflow-hidden rounded-2xl border border-[#333] bg-[#1c1c1e]/50">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-bold text-white uppercase tracking-wider">Đồng bộ đám mây</span>
              </div>
              <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold border border-green-500/20">
                ACTIVE
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Google Sheets:</span>
                <span className="text-gray-300 font-medium truncate ml-4 max-w-[180px]">Connected via App Script</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Lần cuối:</span>
                <span className="text-gray-300 font-medium">Vừa xong</span>
              </div>
            </div>

            <button
              onClick={fetchDataFromSheet}
              disabled={isFetching}
              className="mt-6 w-full py-3.5 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
              {isFetching ? 'Đang đồng bộ...' : 'Đồng bộ thủ công'}
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center pb-10">
          <p className="text-gray-600 text-[10px] uppercase tracking-[0.3em]">CostSaving Pro v1.1.9</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="w-8 h-[1px] bg-[#333]"></span>
            <span className="text-gray-700 text-xs">Made with Precision</span>
            <span className="w-8 h-[1px] bg-[#333]"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
