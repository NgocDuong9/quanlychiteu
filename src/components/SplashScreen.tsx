import { useEffect, useState, useRef } from 'react';

const LOVE_QUOTES = [
  'Có chồng chi tiêu rõ ràng, vợ yên tâm shopping ngang nhiên',
  'Lương về tay vợ, hạnh phúc về tay chồng',
  'Nhà mình nghèo tiền thôi, chứ giàu tình lắm',
  'Vợ chồng mình cùng cố gắng, con Bo sẽ có tất cả',
  'Yêu nhau mấy núi cũng leo, mấy khoản chi tiêu cũng ghi',
  'Tiền hết có thể kiếm lại, nhưng em thì chỉ có một',
  'Gia đình nhỏ, ước mơ to, cùng nhau cố gắng từng ngày',
  'Hôm nay tiết kiệm một chút, mai mốt đưa con đi chơi xa',
  'Anh lo kiếm tiền, em lo giữ tiền, Bo lo... dễ thương',
  'Đồng nào cũng là mồ hôi, nên mình ghi lại cho đời bớt lo',
  'Hai vợ chồng một túi tiền, ghi chép cẩn thận bình yên cả nhà',
  'Cơm nhà nấu ngon hơn tiệm, vì có tình yêu nêm vào',
  'Mỗi ngày thêm yêu nhau, mỗi ngày thêm biết tiết kiệm',
  'Con Bo lớn lên sẽ tự hào vì ba mẹ giỏi quá',
];

// Read quote from static splash (index.html) so both show the same quote
const staticQuoteEl = document.getElementById('splash-quote');
const selectedQuote = staticQuoteEl?.textContent || LOVE_QUOTES[Math.floor(Math.random() * LOVE_QUOTES.length)];

interface SplashScreenProps {
  onFinished: () => void;
  minDuration?: number;
}

export default function SplashScreen({ onFinished, minDuration = 1500 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'visible' | 'exit'>('visible');
  const cleanedUp = useRef(false);

  useEffect(() => {
    if (cleanedUp.current) return;

    // Smoothly remove static splash by fading it out
    const staticSplash = document.getElementById('static-splash');
    if (staticSplash) {
      staticSplash.style.transition = 'opacity 0.3s ease-out';
      staticSplash.style.opacity = '0';
      setTimeout(() => staticSplash.remove(), 300);
    }

    const exitTimer = setTimeout(() => setPhase('exit'), minDuration);
    const doneTimer = setTimeout(() => onFinished(), minDuration + 800);

    return () => {
      cleanedUp.current = true;
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [minDuration, onFinished]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        background: '#000000',
        transition: 'opacity 0.7s ease-out',
        opacity: phase === 'exit' ? 0 : 1,
      }}
    >
      {/* Floating particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              borderRadius: '50%',
              background: `rgba(255, ${150 + Math.floor(Math.random() * 105)}, ${Math.floor(Math.random() * 100)}, ${0.3 + Math.random() * 0.5})`,
              left: `${Math.random() * 100}%`,
              bottom: '-5%',
              animation: `splashFloat ${4 + Math.random() * 6}s ease-in ${Math.random() * 3}s infinite`,
              filter: `blur(${Math.random() > 0.5 ? 1 : 0}px)`,
            }}
          />
        ))}
      </div>

      {/* Shimmer light sweep */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)',
          animation: 'splashShimmer 3s ease-in-out 0.5s infinite',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Logo with glow */}
        <div>
          <img
            src="/favicon.png"
            alt=""
            style={{
              width: 92,
              height: 92,
              borderRadius: 24,
              boxShadow: '0 0 30px rgba(255, 149, 0, 0.3), 0 0 60px rgba(255, 149, 0, 0.15), 0 8px 32px rgba(0,0,0,0.5)',
              animation: 'splashGlow 2.5s ease-in-out infinite',
            }}
          />
        </div>

        {/* App name */}
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: 1,
            textShadow: '0 0 20px rgba(255,149,0,0.4), 0 2px 10px rgba(0,0,0,0.8)',
          }}
        >
          Quản Lý Chi Tiêu
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 16,
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: 0.5,
            fontStyle: 'italic',
            textShadow: '0 1px 8px rgba(0,0,0,0.8)',
            textAlign: 'center',
            padding: '0 32px',
            maxWidth: 340,
          }}
        >
          {selectedQuote}
        </div>
      </div>

      {/* Bottom loading bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 50px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 140,
            height: 3,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 2,
              background: 'linear-gradient(90deg, #ff9500, #ff6b00)',
              animation: 'splashProgress 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splashFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
        @keyframes splashShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes splashGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(255,149,0,0.3), 0 0 60px rgba(255,149,0,0.15), 0 8px 32px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 40px rgba(255,149,0,0.5), 0 0 80px rgba(255,149,0,0.25), 0 8px 32px rgba(0,0,0,0.5); }
        }
        @keyframes splashProgress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
