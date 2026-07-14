import { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Button, message, Typography } from 'antd';
import { SafetyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  generateSmsCode, verifySmsCode, clearSmsCode, getPendingPhone, maskPhone
} from '../utils/mockData';

const { Text } = Typography;

interface SmsVerifyModalProps {
  open: boolean;
  phone: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// 新设备短信二次验证弹窗
function SmsVerifyModal({ open, phone, onSuccess, onCancel }: SmsVerifyModalProps) {
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [code, setCode] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 发送验证码
  const sendCode = () => {
    const targetPhone = phone || getPendingPhone();
    const smsCode = generateSmsCode(targetPhone);
    // 开发模式：验证码直接提示（便于测试）
    message.success(`验证码已发送至 ${maskPhone(targetPhone)}`);
    // 开发提示：在控制台输出验证码
    console.log(`[开发模式] 短信验证码: ${smsCode}`);
    setResendCountdown(60);
  };

  // 重发倒计时
  useEffect(() => {
    if (open && resendCountdown > 0) {
      timerRef.current = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, resendCountdown]);

  // 打开时自动发送
  useEffect(() => {
    if (open) {
      sendCode();
      setCode('');
    } else {
      clearSmsCode();
      setCode('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      message.error('请输入6位验证码');
      return;
    }
    setLoading(true);
    // 模拟网络延迟
    await new Promise(r => setTimeout(r, 800));
    if (verifySmsCode(code)) {
      message.success('验证通过');
      clearSmsCode();
      onSuccess();
    } else {
      message.error('验证码错误或已过期，请重新获取');
    }
    setLoading(false);
  };

  const targetPhone = phone || getPendingPhone();

  return (
    <Modal
      title={
        <span>
          <SafetyOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          新设备二次验证
        </span>
      }
      open={open}
      onOk={handleVerify}
      onCancel={() => {
        clearSmsCode();
        onCancel();
      }}
      confirmLoading={loading}
      okText="验证"
      cancelText="取消"
      width={440}
      maskClosable={false}
    >
      <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
        <Text type="secondary">
          检测到您在<strong>新设备</strong>上登录，为保障账号安全，已向手机号
          <strong> {maskPhone(targetPhone)} </strong>发送短信验证码，请输入验证码完成二次验证。
        </Text>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Input
          size="large"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="请输入6位短信验证码"
          onPressEnter={handleVerify}
          style={{ flex: 1, letterSpacing: 4, textAlign: 'center', fontSize: 18 }}
        />
        <Button
          size="large"
          disabled={resendCountdown > 0}
          icon={<ReloadOutlined />}
          onClick={() => sendCode()}
        >
          {resendCountdown > 0 ? `${resendCountdown}s` : '重新发送'}
        </Button>
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        提示：开发模式下验证码已输出至浏览器控制台（F12查看）
      </Text>
    </Modal>
  );
}

export default SmsVerifyModal;
