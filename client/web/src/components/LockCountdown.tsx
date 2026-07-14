import { useState, useEffect } from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface LockCountdownProps {
  onUnlock: () => void;
}

function LockCountdown({ onUnlock }: LockCountdownProps) {
  const [remainingTime, setRemainingTime] = useState(1800);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onUnlock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onUnlock]);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7', textAlign: 'center' }}>
      <Text type="danger" strong>🔒 账号已锁定</Text>
      <div style={{ marginTop: 8 }}>
        <Text type="secondary">
          连续登录失败次数过多，已临时锁定，请等待{' '}
          <Text type="danger" strong>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </Text>{' '}
          后重试
        </Text>
      </div>
    </div>
  );
}

export default LockCountdown;
