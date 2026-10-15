import React from 'react';
import { Modal } from 'antd';
import TaobaoProductDetail from '../../common/TaobaoProductDetail';
import { useNavigate } from 'react-router-dom';

export default function ProductQuickViewModal({ product, open, onClose, onOrder }) {
  const navigate = useNavigate();

  if (!open || !product) {
    return null;
  }

  const handleAddToCart = (item) => {
    onOrder?.(item);
  };

  const handleBuyNow = (item) => {
    onOrder?.(item);
    onClose?.();
    navigate('/cart');
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1040}
      centered
      destroyOnHidden
      styles={{
        body: {
          padding: 0,
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 24,
        },
        content: {
          padding: 0,
          borderRadius: 24,
          overflow: 'hidden',
        },
      }}
      title={null}
      closable={false}
    >
      <div className="w-full">
        <TaobaoProductDetail
          product={product}
          onClose={onClose}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isModal={false}
        />
      </div>
    </Modal>
  );
}
