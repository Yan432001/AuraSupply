import React from 'react';
import { Space, Typography } from 'antd';
import { CheckCircleFilled, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Validates password against required complexity rules:
 * - Minimum 8 characters
 * - Uppercase letter (A-Z)
 * - Lowercase letter (a-z)
 * - Number (0-9)
 * - Symbol / Special character (!@#$%^&*...)
 */
export const validatePasswordComplexity = (password = '') => {
  const str = String(password || '');
  const hasLength = str.length >= 8;
  const hasUpper = /[A-Z]/.test(str);
  const hasLower = /[a-z]/.test(str);
  const hasNumber = /[0-9]/.test(str);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(str);

  return {
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
    isValid: hasLength && hasUpper && hasLower && hasNumber && hasSymbol
  };
};

export const passwordComplexityRule = (t) => ({
  validator(_, value) {
    if (!value) return Promise.resolve();
    const result = validatePasswordComplexity(value);
    if (!result.isValid) {
      return Promise.reject(
        new Error(
          t
            ? t(
                'password_complexity_error',
                'Password must include uppercase, lowercase, numbers, symbols, and be at least 8 characters.'
              )
            : 'Password must include uppercase, lowercase, numbers, symbols, and be at least 8 characters.'
        )
      );
    }
    return Promise.resolve();
  }
});

export default function PasswordComplexityIndicator({ password = '', t }) {
  const stats = validatePasswordComplexity(password);

  const criteria = [
    { key: 'len', label: t ? t('at_least_8_chars', 'Min. 8 characters') : 'Min. 8 characters', met: stats.hasLength },
    { key: 'upper', label: t ? t('uppercase_letter', 'Uppercase (A-Z)') : 'Uppercase (A-Z)', met: stats.hasUpper },
    { key: 'lower', label: t ? t('lowercase_letter', 'Lowercase (a-z)') : 'Lowercase (a-z)', met: stats.hasLower },
    { key: 'num', label: t ? t('number_digit', 'Number (0-9)') : 'Number (0-9)', met: stats.hasNumber },
    { key: 'sym', label: t ? t('symbol_special', 'Symbol (!@#$...)') : 'Symbol (!@#$...)', met: stats.hasSymbol },
  ];

  if (!password) {
    return (
      <div style={{ marginTop: 6, fontSize: 11.5, color: '#64748b' }}>
        <Text type="secondary" style={{ fontSize: 11.5 }}>
          {t ? t('password_requirements_hint', 'Must include uppercase (A-Z), lowercase (a-z), numbers (0-9), and symbols (!@#$).') : 'Must include uppercase (A-Z), lowercase (a-z), numbers (0-9), and symbols (!@#$).'}
        </Text>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {t ? t('password_strength_criteria', 'Password Criteria:') : 'Password Criteria:'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '4px 8px' }}>
        {criteria.map((item) => (
          <div
            key={item.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11.5,
              color: item.met ? '#16a34a' : '#94a3b8',
              fontWeight: item.met ? 600 : 400,
              transition: 'color 0.2s ease'
            }}
          >
            {item.met ? (
              <CheckCircleFilled style={{ color: '#16a34a', fontSize: 12 }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#cbd5e1', fontSize: 12 }} />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
