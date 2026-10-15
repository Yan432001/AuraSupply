import React, { useState } from 'react';
import {
  Card,
  Image,
  Typography,
  Space,
  Button,
  Divider,
  Popover,
  Tag,
  Avatar,
  Dropdown,
  Grid,
} from 'antd';
import {
  HeartOutlined,
  ShareAltOutlined,
  FlagOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
} from '@ant-design/icons';
import ReactionPopover from '../web/common/ReactionPopover';
import { formatCurrency, publicTheme } from '../../utils/webTheme';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const PostCard = ({ post, onReact, isOwner = false, onEdit, onDelete, onViewStats }) => {
  const screens = useBreakpoint();
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const ownerMenuItems = [
    {
      key: 'edit',
      label: 'Edit Post',
      icon: <EditOutlined />,
      onClick: () => onEdit && onEdit(post.id),
    },
    {
      key: 'stats',
      label: 'View Stats',
      icon: <EyeOutlined />,
      onClick: () => onViewStats && onViewStats(post.id),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete && onDelete(post.id),
    },
  ];

  return (
    <Card
      hoverable
      cover={
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: screens.xs ? '12px 12px 0 0' : '16px 16px 0 0',
            height: screens.xs ? 170 : 210,
          }}
        >
          <Image
            alt={post.title}
            src={post.image}
            style={{
              borderRadius: screens.xs ? '12px 12px 0 0' : '16px 16px 0 0',
              objectFit: 'cover',
              height: '100%',
              transition: 'transform 0.3s ease',
            }}
            preview={false}
          />

          {post.isProduct && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                padding: '6px 10px',
                borderRadius: 999,
                background: 'rgba(33,122,89,0.92)',
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Product
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              maxWidth: '70%',
            }}
          >
            {post.tags.slice(0, screens.xs ? 1 : 2).map((tag) => (
              <Tag
                key={tag}
                style={{
                  borderRadius: 999,
                  color: publicTheme.text,
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {tag}
              </Tag>
            ))}
          </div>

          {post.views && (
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                background: 'rgba(31,45,56,0.78)',
                color: 'white',
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <EyeOutlined />
              {post.views}
            </div>
          )}
        </div>
      }
      style={{
        borderRadius: screens.xs ? 14 : 18,
        boxShadow: publicTheme.lightShadow,
        border: `1px solid ${publicTheme.border}`,
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        height: '100%',
        background: publicTheme.cardBackground,
      }}
      onMouseEnter={(event) => {
        if (!screens.xs) {
          event.currentTarget.style.boxShadow = publicTheme.shadow;
          event.currentTarget.style.transform = 'translateY(-4px)';
        }
      }}
      onMouseLeave={(event) => {
        if (!screens.xs) {
          event.currentTarget.style.boxShadow = publicTheme.lightShadow;
          event.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      styles={{
        body: {
          padding: screens.xs ? 14 : 18,
        },
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={screens.xs ? 8 : 12}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <Title
            level={4}
            style={{
              margin: 0,
              fontSize: screens.xs ? 15 : 17,
              fontWeight: 700,
              color: publicTheme.text,
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            {post.title}
          </Title>

          {post.price && (
            <div
              style={{
                background: publicTheme.ribbon,
                color: 'white',
                padding: screens.xs ? '4px 8px' : '6px 12px',
                borderRadius: 10,
                fontSize: screens.xs ? 12 : 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {formatCurrency(post.price)}
            </div>
          )}
        </div>

        <Paragraph
          ellipsis={{ rows: screens.xs ? 2 : 3 }}
          style={{
            margin: 0,
            color: publicTheme.subtext,
            fontSize: screens.xs ? 12 : 14,
            lineHeight: 1.5,
          }}
        >
          {post.description}
        </Paragraph>

        {post.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <StarOutlined style={{ color: publicTheme.warning, fontSize: screens.xs ? 12 : 14 }} />
            <Text strong style={{ fontSize: screens.xs ? 12 : 14, color: publicTheme.text }}>
              {post.rating}
            </Text>
            <Text style={{ fontSize: screens.xs ? 11 : 13, color: publicTheme.subtext }}>
              ({post.reviewCount} reviews)
            </Text>
          </div>
        )}

        <Divider style={{ margin: screens.xs ? '4px 0' : '8px 0', borderColor: publicTheme.softBorder }} />

        <Space direction="vertical" style={{ width: '100%' }} size={screens.xs ? 6 : 8}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
            <Space size={8} align="start">
              <Avatar
                src={post.user.avatar}
                size={screens.xs ? 30 : 34}
                style={{
                  border: `2px solid ${publicTheme.cardMuted}`,
                  background: isOwner ? publicTheme.primary : publicTheme.cardMuted,
                }}
              />
              <div>
                <Text strong style={{ color: publicTheme.text, display: 'block', fontSize: screens.xs ? 12 : 13 }}>
                  {post.user.name}
                </Text>
                <Text style={{ fontSize: screens.xs ? 10 : 12, color: publicTheme.subtext }}>
                  {post.user.role || 'Business Team'}
                </Text>
              </div>
            </Space>

            <div
              style={{
                background: publicTheme.cardMuted,
                padding: screens.xs ? '3px 8px' : '4px 12px',
                borderRadius: 999,
                fontSize: screens.xs ? 10 : 12,
                fontWeight: 600,
                color: publicTheme.primary,
              }}
            >
              {post.reactions.inspired + post.reactions.relatable} reactions
            </div>
          </Space>

          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space size={screens.xs ? 4 : 8}>
              <Popover
                content={
                  <ReactionPopover
                    postId={post.id}
                    reactions={post.reactions}
                    onReact={onReact}
                  />
                }
                placement="top"
                trigger={screens.xs ? 'click' : 'hover'}
              >
                <Button
                  type="text"
                  icon={<HeartOutlined />}
                  size="small"
                  style={{
                    color: isLiked ? publicTheme.danger : publicTheme.subtext,
                    fontSize: screens.xs ? 12 : 14,
                  }}
                  onClick={handleLike}
                >
                  {screens.xs ? '' : 'React'}
                </Button>
              </Popover>

              <Button
                type="text"
                icon={<ShareAltOutlined />}
                size="small"
                style={{
                  color: publicTheme.subtext,
                  fontSize: screens.xs ? 12 : 14,
                }}
              >
                {screens.xs ? '' : 'Share'}
              </Button>

              {post.isProduct && (
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  size="small"
                  style={{
                    background: publicTheme.ribbon,
                    border: 'none',
                    fontSize: screens.xs ? 12 : 14,
                  }}
                >
                  {screens.xs ? '' : 'RFQ'}
                </Button>
              )}
            </Space>

            <Space size={screens.xs ? 4 : 8}>
              {isOwner && (
                <Dropdown
                  menu={{ items: ownerMenuItems }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    size="small"
                    style={{ color: publicTheme.subtext }}
                  />
                </Dropdown>
              )}

              <Button
                type="text"
                icon={<FlagOutlined />}
                size="small"
                style={{
                  color: publicTheme.subtext,
                  fontSize: screens.xs ? 12 : 14,
                }}
              >
                {screens.xs ? '' : 'Flag'}
              </Button>
            </Space>
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

export default PostCard;
