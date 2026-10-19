import React, { useState } from 'react';
import { Modal, Button, Input } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';

const PosCalculatorModal = ({ visible, onClose, themeMode, t }) => {
  const isDark = themeMode === 'dark';
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState(null);
  const [op, setOp] = useState(null);

  const handleDigit = (d) => {
    setDisplay((prev) => (prev === '0' ? String(d) : prev + String(d)));
  };

  const handleDot = () => {
    if (!display.includes('.')) setDisplay((prev) => prev + '.');
  };

  const handleOp = (operator) => {
    setPrevVal(parseFloat(display));
    setOp(operator);
    setDisplay('0');
  };

  const handleEquals = () => {
    if (op && prevVal !== null) {
      const cur = parseFloat(display);
      let res = 0;
      if (op === '+') res = prevVal + cur;
      else if (op === '-') res = prevVal - cur;
      else if (op === '×') res = prevVal * cur;
      else if (op === '÷') res = cur !== 0 ? prevVal / cur : 0;
      setDisplay(String(parseFloat(res.toFixed(4))));
      setPrevVal(null);
      setOp(null);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevVal(null);
    setOp(null);
  };

  const btnStyle = {
    height: 48,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={360}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <CalculatorOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
        <span style={{ fontSize: 16, fontWeight: 800 }}>Financial Calculator</span>
      </div>

      {/* Screen */}
      <div
        style={{
          background: isDark ? '#020617' : '#f1f5f9',
          padding: '14px 16px',
          borderRadius: 12,
          textAlign: 'right',
          fontSize: 28,
          fontWeight: 900,
          color: '#2563eb',
          fontFamily: 'monospace',
          marginBottom: 14,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {display}
      </div>

      {/* Grid Keypad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <button type="button" onClick={handleClear} style={{ ...btnStyle, background: '#fee2e2', color: '#dc2626' }}>C</button>
        <button type="button" onClick={() => setDisplay((p) => String(-parseFloat(p)))} style={{ ...btnStyle, background: '#f1f5f9', color: '#475569' }}>±</button>
        <button type="button" onClick={() => setDisplay((p) => String(parseFloat(p) / 100))} style={{ ...btnStyle, background: '#f1f5f9', color: '#475569' }}>%</button>
        <button type="button" onClick={() => handleOp('÷')} style={{ ...btnStyle, background: '#fef3c7', color: '#b45309' }}>÷</button>

        <button type="button" onClick={() => handleDigit(7)} style={{ ...btnStyle, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>7</button>
        <button type="button" onClick={() => handleDigit(8)} style={{ ...btnStyle, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>8</button>
        <button type="button" onClick={() => handleDigit(9)} style={{ ...btnStyle, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>9</button>
        <button type="button" onClick={() => handleOp('×')} style={{ ...btnStyle, background: '#fef3c7', color: '#b45309' }}>×</button>

        <button type="button" onClick={() => handleDigit(4)} style={{ ...btnStyle, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>4</button>
        <button type="button" onClick={() => handleDigit(5)} style={{ ...btnStyle, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>5</button>
        <button type="button" onClick={() => handleDigit(6)} style={{ ...btnStyle, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>6</button>
        <button type="button" onClick={() => handleOp('-')} style={{ ...btnStyle, background: '#fef3c7', color: '#b45309' }}>-</button>

        <button type="button" onClick={() => handleDigit(1)} style={{ ...btnStyle, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>1</button>
        <button type="button" onClick={() => handleDigit(2)} style={{ ...btnStyle, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>2</button>
        <button type="button" onClick={() => handleDigit(3)} style={{ ...btnStyle, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>3</button>
        <button type="button" onClick={() => handleOp('+')} style={{ ...btnStyle, background: '#fef3c7', color: '#b45309' }}>+</button>

        <button type="button" onClick={() => handleDigit(0)} style={{ ...btnStyle, gridColumn: 'span 2', background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>0</button>
        <button type="button" onClick={handleDot} style={{ ...btnStyle, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#1e293b' }}>.</button>
        <button type="button" onClick={handleEquals} style={{ ...btnStyle, background: '#2563eb', color: '#ffffff' }}>=</button>
      </div>
    </Modal>
  );
};

export default PosCalculatorModal;
