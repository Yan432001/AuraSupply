import React, { useEffect, useState } from 'react';
import {
  Typography,
  Grid,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Input,
  Form,
  Select,
  Row,
  Col,
  Card,
  Popconfirm,
  message,
  Tooltip,
  InputNumber,
  Drawer,
  Divider,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  MenuOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";

import { request } from '../../utils/helpers';
import { useNotification } from './NotificationContext';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Option } = Select;

const CategoriesPage = () => {
  const adminTheme = useAdminTheme();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = !screens.lg;
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchText, selectedStatus]);

  const notify = (type, action, description = null) => {
    showNotification({
      message: `${action} Category`,
      description: description || `Category has been successfully ${action.toLowerCase()}.`,
      type: type,
      duration: 3000,
    });
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await request("categories", "GET", null);
      if (response && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      notify("error", "Fetch Failed", "Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = [...categories];
    
    // Search filter
    if (searchText) {
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(searchText.toLowerCase()) ||
        cat.code.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(cat => cat.status === selectedStatus);
    }
    
    setFilteredCategories(filtered);
  };

  const onClickAddBtn = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ 
      status: "Show",
      parent: 0,
      order_number: categories.length + 1 
    });
    setModalVisible(true);
  };

  const onCloseModal = () => {
    setModalVisible(false);
    setEditingId(null);
    form.resetFields();
  };

  const onSaveCategory = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      
      const categoryData = {
        name: values.name,
        code: values.code,
        order_number: values.order_number,
        parent_id: values.parent || 0,
        status: values.status,
      };

      if (editingId) {
        categoryData.id = editingId;
        const res = await request("categories", "PUT", categoryData);
        if (res && res.success) {
          notify("success", "Updated");
        }
      } else {
        const res = await request("categories", "POST", categoryData);
        if (res && res.success) {
          notify("success", "Added");
        }
      }
      
      onCloseModal();
      fetchCategories();
      
    } catch (err) {
      console.log("Save category error:", err);
      const action = editingId ? "Update" : "Add";
      notify("error", `${action} Failed`, err.message || "Please check your input and try again.");
    } finally {
      setModalLoading(false);
    }
  };

  const onEditCategory = async (data) => {
    try {
      form.setFieldsValue({
        name: data.name,
        code: data.code,
        order_number: data.order_number,
        parent: data.parent_id || 0,
        status: data.status,
      });
      setEditingId(data.id);
      setModalVisible(true);
    } catch (err) {
      console.log("Edit category error:", err);
      notify("error", "Edit Failed", "Failed to load category data.");
    }
  };
  const onPrintCategory = async (data) => {
    try {
      // form.setFieldsValue({
      //   name: data.name,
      //   code: data.code,
      //   order_number: data.order_number,
      //   parent: data.parent_id || 0,
      //   status: data.status,
      // });
      alert(data.id);
      // setEditingId(data.id);
      // setModalVisible(true);
    } catch (err) {
      console.log("Print category error:", err);
      notify("error", "Print Failed", "Failed to load category data.");
    }
  };

  const onDeleteCategory = async (data) => {
    try {
      const res = await request("categories", "DELETE", { id: data.id });
      if (res && res.success) {
        fetchCategories();
        notify("success", "Deleted");
      }
    } catch (err) {
      console.log("Delete category error:", err);
      notify("error", "Delete Failed", "Failed to delete category. Please try again.");
    }
  };

  const onToggleStatus = async (category) => {
    try {
      const newStatus = category.status === "Show" ? "Hide" : "Show";
      const res = await request("categories", "PUT", {
        id: category.id,
        status: newStatus
      });
      
      if (res && res.success) {
        fetchCategories();
        notify("success", "Status Updated");
      }
    } catch (err) {
      console.log("Toggle status error:", err);
      notify("error", "Update Failed", "Failed to update status.");
    }
  };

  const getParentName = (parentId) => {
    if (!parentId || parentId === 0) return <Text type="secondary">-</Text>;
    const parentCat = categories.find(cat => cat.id === parentId);
    return parentCat ? parentCat.name : `ID: ${parentId}`;
  };

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 80,
      responsive: ['lg'],
      sorter: (a, b) => a.id - b.id,
    },
    { 
      title: 'Code', 
      dataIndex: 'code', 
      key: 'code', 
      width: 120,
      responsive: ['md'],
      render: (code) => (
        <Tag color="blue" style={{ margin: 0, fontSize: isMobile ? '11px' : '12px' }}>
          {code}
        </Tag>
      )
    },
    { 
      title: 'Name', 
      dataIndex: 'name', 
      key: 'name',
      width: 200,
      render: (name, record) => (
        <div>
          <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>
            {name}
          </Text>
          {record.parent_id && record.parent_id !== 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: isMobile ? '11px' : '12px' }}>
                Parent: {getParentName(record.parent_id)}
              </Text>
            </div>
          )}
        </div>
      )
    },
    { 
      title: 'Order', 
      dataIndex: 'order_number', 
      key: 'order_number', 
      width: 100,
      responsive: ['lg'],
      sorter: (a, b) => a.order_number - b.order_number,
      render: (order_number) => (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: adminTheme.systemTeal,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {order_number}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      responsive: ['sm'],
      filters: [
        { text: 'Show', value: 'Show' },
        { text: 'Hide', value: 'Hide' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status, record) => (
        <Tooltip title={`Click to ${status === "Show" ? "hide" : "show"}`}>
          <Tag 
            color={status === "Show" ? "green" : "red"}
            style={{ 
              cursor: 'pointer', 
              margin: 0,
              fontSize: isMobile ? '11px' : '12px',
              padding: isMobile ? '2px 6px' : '4px 8px',
            }}
            onClick={() => onToggleStatus(record)}
            icon={status === "Show" ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          >
            {isMobile ? (status === "Show" ? 'S' : 'H') : status}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? 120 : 180,
      fixed: isMobile ? 'right' : false,
      render: (_, record) => (
        <Space size={isMobile ? 4 : 8}>
          <Tooltip title="print">
            <Button 
              type="default" 
              size={isMobile ? "small" : "middle"}
              icon={<PrinterOutlined />}
              onClick={() => onPrintCategory(record)}
              style={{ minWidth: isMobile ? 32 : 40 }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="default" 
              size={isMobile ? "small" : "middle"}
              icon={<EditOutlined />}
              onClick={() => onEditCategory(record)}
              style={{ minWidth: isMobile ? 32 : 40 }}
            />
          </Tooltip>
          
          <Popconfirm
            title="Delete Category"
            description={
              <div>
                <p>Are you sure you want to delete this category?</p>
                <p><strong>{record.name}</strong></p>
                <Text type="danger">This action cannot be undone.</Text>
              </div>
            }
            onConfirm={() => onDeleteCategory(record)}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
            placement="topRight"
          >
            <Tooltip title="Delete">
              <Button 
                danger 
                type="default" 
                size={isMobile ? "small" : "middle"}
                icon={<DeleteOutlined />}
                style={{ minWidth: isMobile ? 32 : 40 }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const mobileColumns = [
    {
      title: 'Category',
      key: 'category',
      render: (_, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Text strong style={{ fontSize: '14px', display: 'block' }}>
                {record.name}
              </Text>
              <Space size={8} style={{ marginTop: 4 }}>
                <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>
                  {record.code}
                </Tag>
                <Tag 
                  color={record.status === "Show" ? "green" : "red"}
                  style={{ fontSize: '11px', margin: 0 }}
                >
                  {record.status}
                </Tag>
              </Space>
              {record.parent_id && record.parent_id !== 0 && (
                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: 4 }}>
                  Parent: {getParentName(record.parent_id)}
                </Text>
              )}
            </div>
            <Space size={4}>
              <Button 
                type="default" 
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEditCategory(record)}
              />
              <Popconfirm
                title="Delete Category"
                description="Are you sure?"
                onConfirm={() => onDeleteCategory(record)}
                okText="Delete"
                okType="danger"
                cancelText="Cancel"
              >
                <Button 
                  danger 
                  size="small"
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Space>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? '8px' : '0' }}>
      {/* Header Card with Search and Actions */}
      <Card 
        style={{ 
          marginBottom: 16,
          boxShadow: adminTheme.isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
          borderRadius: 16,
          background: adminTheme.card,
          border: `1px solid ${adminTheme.border}`,
        }}
        styles={{ 
          body: {
            padding: isMobile ? '16px' : '22px 24px' 
          }
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Title level={isMobile ? 4 : 2} style={{ margin: 0, color: adminTheme.text }}>
                Categories Management
              </Title>
              <Tag color="blue" style={{ fontSize: isMobile ? '11px' : '12px' }}>
                {filteredCategories.length} categories
              </Tag>
            </div>
          </Col>
          
          <Col xs={24} md={12}>
            <Space direction={isMobile ? "vertical" : "horizontal"} style={{ width: '100%', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
              <Input
                placeholder="Search categories..."
                prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size={isMobile ? "middle" : "large"}
                style={{ width: isMobile ? '100%' : 220 }}
                allowClear
              />
              
              {isMobile && (
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFilterDrawerOpen(true)}
                  size="middle"
                  style={{ width: '100%' }}
                >
                  Filters
                </Button>
              )}
              
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={onClickAddBtn}
                size={isMobile ? "middle" : "large"}
                style={isMobile ? { width: '100%' } : {}}
              >
                {isMobile ? 'Add New' : 'Add Category'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filter Drawer for Mobile */}
      {isMobile && (
        <Drawer
          title="Filter Categories"
          placement="right"
          onClose={() => setFilterDrawerOpen(false)}
          open={filterDrawerOpen}
          width={280}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ color: adminTheme.text }}>Status</Text>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: '100%', marginTop: 8 }}
                size="middle"
              >
                <Option value="all">All Status</Option>
                <Option value="Show">Show</Option>
                <Option value="Hide">Hide</Option>
              </Select>
            </div>
            
            <Divider style={{ borderColor: adminTheme.border }} />
            
            <div>
              <Text strong style={{ color: adminTheme.text }}>Order By</Text>
              <Select
                defaultValue="name"
                style={{ width: '100%', marginTop: 8 }}
                size="middle"
              >
                <Option value="name">Name (A-Z)</Option>
                <Option value="order_number">Display Order</Option>
                <Option value="id">ID</Option>
              </Select>
            </div>
            
            <Button 
              type="default" 
              onClick={() => {
                setSelectedStatus('all');
                setSearchText('');
              }}
              style={{ width: '100%', marginTop: 16 }}
            >
              Clear Filters
            </Button>
          </Space>
        </Drawer>
      )}

      {/* Desktop/Tablet Table View */}
      {!isMobile && (
        <Card 
          style={{ 
            boxShadow: adminTheme.isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
            borderRadius: 16,
            background: adminTheme.card,
            border: `1px solid ${adminTheme.border}`,
          }}
          styles={{
            body: {
              padding: 0
            }
          }}
        >
          <Table
            rowKey="id"
            dataSource={filteredCategories}
            columns={columns}
            loading={loading}
            scroll={{ x: isTablet ? 800 : 'max-content' }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: !isMobile,
              showTotal: (total) => `Total ${total} categories`,
              size: isMobile ? "small" : "default",
              responsive: true,
              simple: isMobile,
            }}
            size={isMobile ? "small" : "middle"}
            style={{ border: 'none' }}
          />
        </Card>
      )}

      {/* Mobile List View */}
      {isMobile && (
        <Card 
          style={{ 
            borderRadius: 16,
            boxShadow: adminTheme.isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
            background: adminTheme.card,
            border: `1px solid ${adminTheme.border}`,
          }}
          styles={{ 
            body: {
              padding: 0
            }
          }}
        >
          {filteredCategories.length > 0 ? (
            <div style={{ maxHeight: 'calc(100vh - 240px)', overflow: 'auto' }}>
              {filteredCategories.map((category) => (
                <div 
                  key={category.id}
                  style={{
                    padding: '16px',
                    borderBottom: `1px solid ${adminTheme.border}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: '14px', display: 'block', color: adminTheme.text }}>
                        {category.name}
                      </Text>
                      <Space size={4} style={{ marginTop: 8, flexWrap: 'wrap' }}>
                        <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>
                          {category.code}
                        </Tag>
                        <Text style={{ fontSize: '11px', color: adminTheme.subtext }}>
                          Order: {category.order_number}
                        </Text>
                        <Tag 
                          color={category.status === "Show" ? "green" : "red"}
                          style={{ fontSize: '11px', margin: 0, cursor: 'pointer' }}
                          onClick={() => onToggleStatus(category)}
                        >
                          {category.status}
                        </Tag>
                      </Space>
                      {category.parent_id && category.parent_id !== 0 && (
                        <Text style={{ fontSize: '11px', display: 'block', marginTop: 4, color: adminTheme.subtext }}>
                          Parent: {getParentName(category.parent_id)}
                        </Text>
                      )}
                    </div>
                    <Space size={8} style={{ marginLeft: 12 }}>
                      <Button 
                        type="text" 
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => onEditCategory(category)}
                      />
                      <Popconfirm
                        title="Delete Category"
                        description="Are you sure?"
                        onConfirm={() => onDeleteCategory(category)}
                        okText="Delete"
                        okType="danger"
                        cancelText="Cancel"
                      >
                        <Button 
                          danger 
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '48px 24px', 
              textAlign: 'center',
              color: '#999',
            }}>
              <Title level={4} style={{ color: '#999' }}>
                No categories found
              </Title>
              <Text type="secondary">
                {searchText ? 'Try a different search term' : 'Add your first category to get started'}
              </Text>
            </div>
          )}
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        forceRender
        open={modalVisible}
        title={
          <Title level={4} style={{ margin: 0 }}>
            {editingId ? (
              <>
                <EditOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                Edit Category
              </>
            ) : (
              <>
                <PlusOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                Add New Category
              </>
            )}
          </Title>
        }
        onCancel={onCloseModal}
        footer={null}
        centered
        width={isMobile ? "90%" : 520}
        destroyOnHidden
        styles={{
          body: { paddingTop: 24 }
        }}
      >
        <Form 
          form={form} 
          layout="vertical"
          requiredMark="optional"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                label="Category Name"
                name="name"
                rules={[
                  { required: true, message: "Please enter category name" },
                  { min: 2, message: "Name must be at least 2 characters" }
                ]}
              >
                <Input 
                  placeholder="e.g. Electronics" 
                  size={isMobile ? "middle" : "large"}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Category Code 
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                      (Unique)
                    </Text>
                  </span>
                }
                name="code"
                rules={[
                  { required: true, message: "Please enter category code" },
                  { pattern: /^[A-Z0-9_]+$/, message: "Only uppercase letters, numbers and underscore" }
                ]}
              >
                <Input 
                  placeholder="e.g. ELEC" 
                  size={isMobile ? "middle" : "large"}
                  style={{ textTransform: 'uppercase' }}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item 
                label="Display Order" 
                name="order_number"
                rules={[{ 
                  required: true, 
                  message: "Please enter display order number" 
                }]}
              >
                <InputNumber 
                  min={0}
                  size={isMobile ? "middle" : "large"}
                  placeholder="0" 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item 
                label="Parent Category" 
                name="parent"
                tooltip="Leave as 'None' for top-level category"
              >
                <Select 
                  placeholder="Select parent category" 
                  allowClear
                  size={isMobile ? "middle" : "large"}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  <Option value={0}>
                    <Text type="secondary">None (Top Level)</Text>
                  </Option>
                  {categories
                    .filter(cat => !editingId || cat.id !== editingId)
                    .map(cat => (
                      <Option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.code})
                      </Option>
                    ))
                  }
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Status" name="status">
                <Select size={isMobile ? "middle" : "large"}>
                  <Option value="Show">
                    <Space>
                      <EyeOutlined />
                      Show (Visible to users)
                    </Space>
                  </Option>
                  <Option value="Hide">
                    <Space>
                      <EyeInvisibleOutlined />
                      Hide (Hidden from users)
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Space 
            style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid #f0f0f0'
            }}
            size="middle"
          >
            <Button 
              onClick={onCloseModal}
              size={isMobile ? "middle" : "large"}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              onClick={onSaveCategory}
              loading={modalLoading}
              size={isMobile ? "middle" : "large"}
            >
              {editingId ? "Update Category" : "Create Category"}
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;