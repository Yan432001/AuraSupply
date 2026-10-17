import React from 'react';
import { Space, Button } from 'antd';
import { HeartOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from '../../../contexts/LanguageContext';

const ReactionPopover = ({ postId, reactions, onReact }) => {
  const { t } = useTranslation();
  return (
    <Space direction="vertical" style={{ width: 140 }}>
      <Button
        type="text"
        icon={<HeartOutlined style={{ color: '#EF4444' }} />}
        onClick={() => onReact(postId, 'inspired')}
        block
        style={{ textAlign: 'left', color: '#1E293B', fontWeight: 600 }}
      >
        {t('inspired', 'Inspired')} ({reactions.inspired})
      </Button>
      <Button
        type="text"
        icon={<UserOutlined style={{ color: '#6366F1' }} />}
        onClick={() => onReact(postId, 'relatable')}
        block
        style={{ textAlign: 'left', color: '#1E293B', fontWeight: 600 }}
      >
        {t('relatable', 'Relatable')} ({reactions.relatable})
      </Button>
    </Space>
  );
};

export default ReactionPopover;