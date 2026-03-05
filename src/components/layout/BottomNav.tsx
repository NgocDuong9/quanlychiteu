import { NavLink } from 'react-router-dom';
import { PenLine, Calendar, PieChart, Wallet, MoreHorizontal } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Nhập vào', icon: PenLine },
  { path: '/calendar', label: 'Lịch', icon: Calendar },
  { path: '/report', label: 'Báo cáo', icon: PieChart },
  { path: '/budget', label: 'Ngân sách', icon: Wallet },
  { path: '/settings', label: 'Khác', icon: MoreHorizontal },
];

export default function BottomNav() {
  return (
    <footer className="shrink-0 border-none pb-0" style={{ backgroundColor: '#000000', border: 'none', boxShadow: 'none' }}>
      <div className="flex justify-around items-center pt-1 pb-0" style={{ backgroundColor: '#000000', border: 'none' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 transition-colors duration-200 ${
                  isActive ? 'text-[#ff9500]' : 'text-gray-500'
                }`
              }
              style={{ backgroundColor: 'transparent', border: 'none' }}
            >
              <Icon size={24} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </footer>
  );
}
