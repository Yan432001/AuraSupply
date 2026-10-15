import React, { useState } from 'react';
import { Button, Card, Checkbox, Divider, Input, Select, Slider, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled, FilterOutlined, StarFilled } from '@ant-design/icons';
import { branches, sellers, shopCategories } from '../../data/shopData';
import { publicTheme } from '../../utils/webTheme';

const { Text, Title } = Typography;

const FilterSidebar = ({
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  selectedBranch,
  setSelectedBranch,
  selectedSellers,
  setSelectedSellers,
  priceRange,
  setPriceRange,
}) => {
  const [sellerSearch, setSellerSearch] = useState('');

  const filteredSellers = sellers.filter((seller) =>
    seller.name.toLowerCase().includes(sellerSearch.toLowerCase())
  );

  const handleSellerToggle = (sellerId) => {
    if (selectedSellers.includes(sellerId)) {
      setSelectedSellers(selectedSellers.filter((id) => id !== sellerId));
    } else {
      setSelectedSellers([...selectedSellers, sellerId]);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory(null);
    setSelectedBranch('all');
    setSelectedSellers([]);
    setPriceRange([0, 5000]);
  };

  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedSubcategory !== null,
    selectedBranch !== 'all',
    selectedSellers.length > 0,
    priceRange[0] > 0 || priceRange[1] < 5000,
  ].filter(Boolean).length;

  return (
    <Card
      style={{
        borderRadius: 28,
        border: `1px solid ${publicTheme.border}`,
        background: publicTheme.cardBackground,
        boxShadow: publicTheme.lightShadow,
      }}
      styles={{ body: { padding: 24 } }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <FilterOutlined style={{ color: publicTheme.primary, fontSize: 18 }} />
            <Title level={5} style={{ margin: 0, color: publicTheme.text }}>
              Sourcing Filters
            </Title>
          </Space>
          {activeFiltersCount > 0 && (
            <Button
              type="link"
              onClick={clearAllFilters}
              style={{
                color: publicTheme.primary,
                padding: 0,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Clear all
            </Button>
          )}
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: 16,
            background: publicTheme.cardMuted,
            border: `1px solid ${publicTheme.softBorder}`,
          }}
        >
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Tag
              style={{
                width: 'fit-content',
                margin: 0,
                borderRadius: 999,
                border: 'none',
                background: publicTheme.pill,
                color: publicTheme.primary,
                fontWeight: 700,
              }}
            >
              Buyer workflow
            </Tag>
            <Text style={{ color: publicTheme.text, fontWeight: 600 }}>
              Narrow verified suppliers, hub stock, and target price before starting a purchase request.
            </Text>
            <Space size={6}>
              <CheckCircleFilled style={{ color: publicTheme.success }} />
              <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>
                {filteredSellers.length} suppliers in this lane
              </Text>
            </Space>
          </Space>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 16, color: publicTheme.text }}>
            Price range
          </Text>
          <div style={{ padding: '0 8px' }}>
            <Slider
              range
              min={0}
              max={5000}
              value={priceRange}
              onChange={setPriceRange}
              tooltip={{ formatter: (value) => `$${value}` }}
              styles={{
                track: { background: publicTheme.ribbon },
                handle: {
                  borderColor: publicTheme.primary,
                  background: publicTheme.primary,
                },
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: publicTheme.subtext }}>${priceRange[0]}</Text>
              <Text style={{ fontSize: 12, color: publicTheme.subtext }}>${priceRange[1]}</Text>
            </div>
          </div>
        </div>

        <Divider style={{ margin: 0, borderColor: publicTheme.softBorder }} />

        <div>
          <Text strong style={{ display: 'block', marginBottom: 12, color: publicTheme.text }}>
            Categories
          </Text>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            <div
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubcategory(null);
              }}
              style={{
                padding: '12px 16px',
                borderRadius: 16,
                cursor: 'pointer',
                background: selectedCategory === 'all' ? publicTheme.ribbon : publicTheme.cardMuted,
                color: selectedCategory === 'all' ? 'white' : publicTheme.subtext,
                fontWeight: selectedCategory === 'all' ? 700 : 500,
                border: selectedCategory === 'all' ? 'none' : `1px solid ${publicTheme.softBorder}`,
              }}
            >
              All Categories
            </div>
            {shopCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedSubcategory(null);
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  background: selectedCategory === category.id ? publicTheme.ribbon : publicTheme.cardMuted,
                  color: selectedCategory === category.id ? 'white' : publicTheme.subtext,
                  fontWeight: selectedCategory === category.id ? 700 : 500,
                  border: selectedCategory === category.id ? 'none' : `1px solid ${publicTheme.softBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{category.icon}</span>
                {category.name}
              </div>
            ))}
          </Space>
        </div>

        {selectedCategory && selectedCategory !== 'all' && (
          <>
            <Divider style={{ margin: 0, borderColor: publicTheme.softBorder }} />
            <div>
              <Text strong style={{ display: 'block', marginBottom: 12, color: publicTheme.text }}>
                Subcategories
              </Text>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <div
                  onClick={() => setSelectedSubcategory(null)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 14,
                    cursor: 'pointer',
                    background: !selectedSubcategory ? publicTheme.primary : publicTheme.cardMuted,
                    color: !selectedSubcategory ? 'white' : publicTheme.subtext,
                    fontWeight: !selectedSubcategory ? 700 : 500,
                  }}
                >
                  All Subcategories
                </div>
                {shopCategories
                  .find((category) => category.id === selectedCategory)
                  ?.subcategories.map((subCategory) => (
                    <div
                      key={subCategory.id}
                      onClick={() => setSelectedSubcategory(subCategory.id)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        background:
                          selectedSubcategory === subCategory.id
                            ? publicTheme.primary
                            : publicTheme.cardMuted,
                        color: selectedSubcategory === subCategory.id ? 'white' : publicTheme.subtext,
                        fontWeight: selectedSubcategory === subCategory.id ? 700 : 500,
                      }}
                    >
                      {subCategory.name}
                    </div>
                  ))}
              </Space>
            </div>
          </>
        )}

        <Divider style={{ margin: 0, borderColor: publicTheme.softBorder }} />

        <div>
          <Text strong style={{ display: 'block', marginBottom: 12, color: publicTheme.text }}>
            Fulfillment hub
          </Text>
          <Select
            value={selectedBranch}
            onChange={setSelectedBranch}
            style={{ width: '100%' }}
            size="large"
            options={branches.map((branch) => ({
              label: branch.name,
              value: branch.id,
            }))}
          />
        </div>

        <Divider style={{ margin: 0, borderColor: publicTheme.softBorder }} />

        <div>
          <Text strong style={{ display: 'block', marginBottom: 12, color: publicTheme.text }}>
            Suppliers
          </Text>
          <Input
            placeholder="Search suppliers..."
            value={sellerSearch}
            onChange={(event) => setSellerSearch(event.target.value)}
            style={{ marginBottom: 12 }}
            size="small"
          />
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {filteredSellers.map((seller) => (
              <div
                key={seller.id}
                onClick={() => handleSellerToggle(seller.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  background: selectedSellers.includes(seller.id) ? publicTheme.cardMuted : 'transparent',
                  border: selectedSellers.includes(seller.id)
                    ? `1px solid ${publicTheme.primary}`
                    : `1px solid ${publicTheme.softBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <Text style={{ fontSize: 14, fontWeight: 500, color: publicTheme.text }}>
                    {seller.name}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <StarFilled style={{ color: publicTheme.warning, fontSize: 12 }} />
                    <Text style={{ fontSize: 12, color: publicTheme.subtext }}>
                      {seller.rating} ({seller.reviews})
                    </Text>
                  </div>
                </div>
                <Checkbox checked={selectedSellers.includes(seller.id)} style={{ pointerEvents: 'none' }} />
              </div>
            ))}
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default FilterSidebar;
