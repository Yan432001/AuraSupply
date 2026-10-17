import React, { useState, useMemo, useEffect } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
  Dropdown,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  Popconfirm,
  Tabs,
  Statistic,
  Divider,
  Progress,
  List,
  Descriptions,
  Timeline,
  Radio,
} from 'antd';
import {
  CheckCircleFilled,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  IdcardOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  WomanOutlined,
  ManOutlined,
  UserAddOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMenuByKey, getModuleByKey, moduleHealthLabel } from '../../data/erpModules';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';
import { fetchAdminCustomers } from '../../utils/apiconfig';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const healthTone = {
  stable: { bg: '#e7faf0', color: '#22c55e' },
  watch: { bg: '#fdf3d9', color: '#f0b429' },
  paused: { bg: '#f2f3f5', color: '#8a94a6' },
};

const statusColor = {
  Active: 'green',
  Pending: 'gold',
  Review: 'blue',
  Discharged: 'gray',
};

const Patients = () => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const moduleKey = searchParams.get('module') || 'clinic';
  const menuKey = searchParams.get('menu') || 'patients';

  const module = useMemo(() => getModuleByKey(moduleKey) || {}, [moduleKey]);
  const menu = useMemo(() => getMenuByKey(moduleKey, menuKey) || {}, [moduleKey, menuKey]);
  const tone = useMemo(() => {
    const isDark = adminTheme.isDark;
    const tones = {
      stable: { bg: isDark ? 'rgba(34, 197, 94, 0.16)' : '#e7faf0', color: isDark ? '#4ade80' : '#22c55e' },
      watch: { bg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#fdf3d9', color: isDark ? '#fbbf24' : '#f0b429' },
      paused: { bg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f3f5', color: isDark ? '#94a3b8' : '#8a94a6' },
    };
    return tones[module.health] || tones.stable;
  }, [adminTheme.isDark, module.health]);

  // State
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('1');
  const [form] = Form.useForm();

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminCustomers();
      const rawList = res?.data || (Array.isArray(res) ? res : []);
      const mapped = rawList.map((c) => ({
        id: `#CUS-${c.id}`,
        name: c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : (c.name || c.username || c.company || `Customer #${c.id}`),
        gender: c.gender ? (c.gender.toLowerCase() === 'female' ? 'Female' : 'Male') : 'Unspecified',
        age: c.age || 30,
        dateOfBirth: c.dob || '1995-01-01',
        phone: c.phone || 'N/A',
        email: c.email || 'N/A',
        address: c.address || 'Phnom Penh, Cambodia',
        status: c.active ? 'Active' : 'Inactive',
        bloodType: 'A+',
        allergies: ['None'],
        lastVisit: c.created_at ? dayjs(c.created_at).format('YYYY-MM-DD') : 'Recently',
        nextAppointment: '-',
        doctor: 'Account Manager',
        department: c.customer_group_name || 'Standard Account',
        avatar: (c.first_name || c.name || 'C').slice(0, 2).toUpperCase(),
        insurance: 'Standard Corporate',
        emergencyContact: c.phone || 'N/A',
        medicalHistory: ['Account Active'],
        currentMedications: [],
        notes: `Customer group: ${c.customer_group_name || 'General'}. Registered account.`,
        visits: [
          { date: dayjs(c.created_at || undefined).format('YYYY-MM-DD'), type: 'Registration', doctor: 'System', notes: 'Account created' }
        ],
      }));
      setPatients(mapped);
    } catch (err) {
      console.error('Failed to load customers:', err);
      message.error('Failed to load customers from database');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter patients
  const filteredPatients = useMemo(() => {
    let filtered = [...patients];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchLower) ||
          patient.id.toLowerCase().includes(searchLower) ||
          patient.email.toLowerCase().includes(searchLower) ||
          patient.phone.includes(searchText)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((patient) => patient.status === filterStatus);
    }

    if (filterDepartment !== 'all') {
      filtered = filtered.filter((patient) => patient.department === filterDepartment);
    }

    return filtered;
  }, [patients, searchText, filterStatus, filterDepartment]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(patients.map(p => p.department));
    return ['all', ...Array.from(depts)];
  }, [patients]);

  // Statistics
  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter(p => p.status === 'Active').length;
    const pending = patients.filter(p => p.status === 'Pending').length;
    const review = patients.filter(p => p.status === 'Review').length;
    return { total, active, pending, review };
  }, [patients]);

  // Table columns
  const columns = [
    {
      title: t('patient_id', 'Patient ID'),
      dataIndex: 'id',
      key: 'id',
      render: (v) => <Text strong style={{ color: module.accent }}>{v}</Text>,
      sorter: (a, b) => a.id.localeCompare(b.id),
      width: 120,
    },
    {
      title: t('patient', 'Patient'),
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Flex align="center" gap={10}>
          <Avatar 
            style={{ 
              background: module.accent,
              cursor: 'pointer'
            }}
            onClick={() => handleViewPatient(record)}
          >
            {record.avatar || name.charAt(0)}
          </Avatar>
          <div>
            <Text strong 
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewPatient(record)}
            >
              {name}
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.gender === 'Male' ? <ManOutlined /> : <WomanOutlined />} 
                {' '}{record.age} {t('years_old', 'yrs')}
              </Text>
            </div>
          </div>
        </Flex>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 200,
    },
    {
      title: t('contact', 'Contact'),
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12 }}>
            <PhoneOutlined style={{ marginRight: 4, color: adminTheme.subtext }} />
            {record.phone}
          </Text>
          <Text style={{ fontSize: 12 }}>
            <MailOutlined style={{ marginRight: 4, color: adminTheme.subtext }} />
            {record.email}
          </Text>
        </Space>
      ),
      width: 200,
    },
    {
      title: t('department', 'Department'),
      dataIndex: 'department',
      key: 'department',
      render: (v) => <Tag color="blue" style={{ borderRadius: 4 }}>{v}</Tag>,
      width: 130,
    },
    {
      title: t('doctor', 'Doctor'),
      dataIndex: 'doctor',
      key: 'doctor',
      width: 120,
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={statusColor[v]} style={{ borderRadius: 999 }}>
          <CheckCircleFilled style={{ marginRight: 4, fontSize: 11 }} />
          {t(v.toLowerCase(), v)}
        </Tag>
      ),
      filters: [
        { text: t('active', 'Active'), value: 'Active' },
        { text: t('pending', 'Pending'), value: 'Pending' },
        { text: t('review', 'Review'), value: 'Review' },
        { text: t('discharged', 'Discharged'), value: 'Discharged' },
      ],
      onFilter: (value, record) => record.status === value,
      width: 120,
    },
    {
      title: t('last_visit', 'Last Visit'),
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      sorter: (a, b) => a.lastVisit.localeCompare(b.lastVisit),
      width: 130,
    },
    {
      title: t('next_appointment', 'Next Appointment'),
      dataIndex: 'nextAppointment',
      key: 'nextAppointment',
      render: (v) => (
        <Text style={{ fontSize: 12 }}>
          <CalendarOutlined style={{ marginRight: 4, color: adminTheme.subtext }} />
          {v}
        </Text>
      ),
      width: 140,
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title={t('view_details', 'View Details')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewPatient(record)}
              style={{ color: adminTheme.primary }}
            />
          </Tooltip>
          <Tooltip title={t('edit', 'Edit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditPatient(record)}
              style={{ color: adminTheme.primary }}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  label: t('view_details', 'View Details'),
                  icon: <EyeOutlined />,
                  onClick: () => handleViewPatient(record),
                },
                {
                  key: 'edit',
                  label: t('edit_patient', 'Edit Patient'),
                  icon: <EditOutlined />,
                  onClick: () => handleEditPatient(record),
                },
                {
                  key: 'delete',
                  label: t('delete_patient', 'Delete Patient'),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeletePatient(record),
                },
              ],
            }}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Handlers
  const handleViewPatient = (record) => {
    setSelectedPatient(record);
    setModalMode('view');
    setActiveTab('1');
    setIsModalVisible(true);
  };

  const handleEditPatient = (record) => {
    setSelectedPatient(record);
    setModalMode('edit');
    form.setFieldsValue({
      ...record,
      dateOfBirth: dayjs(record.dateOfBirth),
      nextAppointment: dayjs(record.nextAppointment),
    });
    setIsModalVisible(true);
  };

  const handleDeletePatient = (record) => {
    setSelectedPatient(record);
    setModalMode('delete');
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    if (modalMode === 'delete') {
      setPatients(patients.filter((p) => p.id !== selectedPatient.id));
      message.success(t('patient_deleted', 'Patient deleted successfully'));
      setIsModalVisible(false);
      setSelectedPatient(null);
    } else if (modalMode === 'edit') {
      form.validateFields().then((values) => {
        const updatedPatients = patients.map((p) =>
          p.id === selectedPatient.id 
            ? { 
                ...p, 
                ...values,
                dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
                nextAppointment: values.nextAppointment?.format('YYYY-MM-DD'),
              } 
            : p
        );
        setPatients(updatedPatients);
        message.success(t('patient_updated', 'Patient updated successfully'));
        setIsModalVisible(false);
        setSelectedPatient(null);
        form.resetFields();
      });
    } else {
      setIsModalVisible(false);
      setSelectedPatient(null);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedPatient(null);
    form.resetFields();
  };

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setModalMode('edit');
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleExport = () => {
    message.success(t('export_started', 'Export started. File will be ready shortly.'));
  };

  const handleRefresh = () => {
    loadCustomers().then(() => message.success(t('data_refreshed', 'Customer data refreshed from database')));
  };

  const handlePrint = () => {
    window.print();
  };

  // Row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
  };

  // Render patient detail modal content
  const renderPatientDetail = () => {
    if (!selectedPatient) return null;

    return (
      <div>
        {/* Patient Header */}
        <Flex align="center" gap={16} style={{ marginBottom: 24 }}>
          <Avatar size={72} style={{ background: module.accent, fontSize: 28 }}>
            {selectedPatient.avatar || selectedPatient.name.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Flex justify="space-between" align="center">
              <div>
                <Title level={4} style={{ margin: 0 }}>{selectedPatient.name}</Title>
                <Text type="secondary">{selectedPatient.id}</Text>
              </div>
              <Tag color={statusColor[selectedPatient.status]} style={{ fontSize: 14, padding: '4px 12px' }}>
                {t(selectedPatient.status?.toLowerCase(), selectedPatient.status)}
              </Tag>
            </Flex>
            <Flex gap={16} style={{ marginTop: 8 }}>
              <Text><UserOutlined /> {selectedPatient.gender}, {selectedPatient.age} {t('years_old', 'years')}</Text>
              <Text><CalendarOutlined /> {t('dob', 'DOB')}: {selectedPatient.dateOfBirth}</Text>
              <Text><HeartOutlined /> {t('blood', 'Blood')}: {selectedPatient.bloodType}</Text>
            </Flex>
          </div>
        </Flex>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={t('overview', 'Overview')} key="1">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small" title={t('contact_info', 'Contact Information')}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label={t('phone', 'Phone')}>{selectedPatient.phone}</Descriptions.Item>
                    <Descriptions.Item label={t('email', 'Email')}>{selectedPatient.email}</Descriptions.Item>
                    <Descriptions.Item label={t('address', 'Address')} span={2}>{selectedPatient.address}</Descriptions.Item>
                    <Descriptions.Item label={t('insurance', 'Insurance')}>{selectedPatient.insurance}</Descriptions.Item>
                    <Descriptions.Item label={t('emergency_contact', 'Emergency Contact')}>{selectedPatient.emergencyContact}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title={t('medical_info', 'Medical Information')}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={t('blood_type', 'Blood Type')}>{selectedPatient.bloodType}</Descriptions.Item>
                    <Descriptions.Item label={t('allergies', 'Allergies')}>
                      {selectedPatient.allergies?.join(', ') || t('none', 'None')}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('medical_history', 'Medical History')}>
                      {selectedPatient.medicalHistory?.join(', ') || t('none', 'None')}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title={t('current_medications', 'Current Medications')}>
                  <List
                    size="small"
                    dataSource={selectedPatient.currentMedications || []}
                    renderItem={(item) => (
                      <List.Item>
                        <MedicineBoxOutlined style={{ marginRight: 8, color: module.accent }} />
                        {item}
                      </List.Item>
                    )}
                    locale={{ emptyText: t('no_medications', 'No medications prescribed') }}
                  />
                </Card>
              </Col>
              <Col span={24}>
                <Card size="small" title={t('visit_history', 'Visit History')}>
                  <Timeline
                    items={selectedPatient.visits?.map((visit) => ({
                      color: 'blue',
                      children: (
                        <div>
                          <Text strong>{visit.type}</Text>
                          <br />
                          <Text type="secondary">{visit.date} - {visit.doctor}</Text>
                          <br />
                          <Text>{visit.notes}</Text>
                        </div>
                      ),
                    })) || [{ children: t('no_visits_recorded', 'No visits recorded') }]}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane tab={t('medical_history', 'Medical History')} key="2">
            <Card size="small">
              <Descriptions column={1} bordered>
                <Descriptions.Item label={t('blood_type', 'Blood Type')}>{selectedPatient.bloodType}</Descriptions.Item>
                <Descriptions.Item label={t('allergies', 'Allergies')}>
                  {selectedPatient.allergies?.join(', ') || t('none', 'None')}
                </Descriptions.Item>
                <Descriptions.Item label={t('medical_history', 'Medical History')}>
                  {selectedPatient.medicalHistory?.join(', ') || t('none', 'None')}
                </Descriptions.Item>
                <Descriptions.Item label={t('current_medications', 'Current Medications')}>
                  {selectedPatient.currentMedications?.join(', ') || t('none', 'None')}
                </Descriptions.Item>
                <Descriptions.Item label={t('notes', 'Notes')}>{selectedPatient.notes}</Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
          
          <TabPane tab={t('appointments', 'Appointments')} key="3">
            <Card size="small">
              <Descriptions column={2}>
                <Descriptions.Item label={t('last_visit', 'Last Visit')}>{selectedPatient.lastVisit}</Descriptions.Item>
                <Descriptions.Item label={t('next_appointment', 'Next Appointment')}>
                  <Tag color="blue">{selectedPatient.nextAppointment}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('primary_doctor', 'Primary Doctor')}>{selectedPatient.doctor}</Descriptions.Item>
                <Descriptions.Item label={t('department', 'Department')}>{selectedPatient.department}</Descriptions.Item>
              </Descriptions>
              
              <Divider />
              <Title level={5}>{t('visit_history', 'Visit History')}</Title>
              <Timeline
                items={selectedPatient.visits?.map((visit) => ({
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>{visit.type}</Text>
                      <br />
                      <Text type="secondary">{visit.date} - {visit.doctor}</Text>
                      <br />
                      <Text>{visit.notes}</Text>
                    </div>
                  ),
                })) || [{ children: t('no_visits_recorded', 'No visits recorded') }]}
              />
            </Card>
          </TabPane>
        </Tabs>
      </div>
    );
  };

  // Render modal content
  const renderModalContent = () => {
    if (modalMode === 'delete') {
      return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <DeleteOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
          <Title level={4}>{t('delete_patient', 'Delete Patient')}</Title>
          <Text>
            {t('confirm_delete_patient', 'Are you sure you want to delete patient')} <strong>{selectedPatient?.name}</strong>?
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('action_cannot_undone', 'This action cannot be undone.')}
            </Text>
          </Text>
        </div>
      );
    }

    if (modalMode === 'view') {
      return renderPatientDetail();
    }

    // Edit mode
    return (
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label={t('full_name', 'Full Name')}
              rules={[{ required: true, message: t('enter_patient_name', 'Please enter patient name') }]}
            >
              <Input placeholder={t('enter_patient_name', 'Enter patient name')} prefix={<UserOutlined />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="gender"
              label={t('gender', 'Gender')}
              rules={[{ required: true, message: t('select_gender', 'Please select gender') }]}
            >
              <Select placeholder={t('select_gender', 'Select gender')}>
                <Option value="Male"><ManOutlined /> {t('male', 'Male')}</Option>
                <Option value="Female"><WomanOutlined /> {t('female', 'Female')}</Option>
                <Option value="Other">{t('other', 'Other')}</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dateOfBirth"
              label={t('dob', 'Date of Birth')}
              rules={[{ required: true, message: t('select_dob', 'Please select date of birth') }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder={t('select_date', 'Select date')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="bloodType"
              label={t('blood_type', 'Blood Type')}
              rules={[{ required: true, message: t('select_blood_type', 'Please select blood type') }]}
            >
              <Select placeholder={t('select_blood_type', 'Select blood type')}>
                <Option value="A+">A+</Option>
                <Option value="A-">A-</Option>
                <Option value="B+">B+</Option>
                <Option value="B-">B-</Option>
                <Option value="AB+">AB+</Option>
                <Option value="AB-">AB-</Option>
                <Option value="O+">O+</Option>
                <Option value="O-">O-</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label={t('phone', 'Phone')}
              rules={[{ required: true, message: t('enter_phone', 'Please enter phone number') }]}
            >
              <Input placeholder={t('enter_phone', 'Enter phone number')} prefix={<PhoneOutlined />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label={t('email', 'Email')}
              rules={[
                { required: true, message: t('enter_email', 'Please enter email') },
                { type: 'email', message: t('enter_valid_email', 'Please enter a valid email') },
              ]}
            >
              <Input placeholder={t('enter_email', 'Enter email address')} prefix={<MailOutlined />} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="address"
              label={t('address', 'Address')}
              rules={[{ required: true, message: t('enter_address', 'Please enter address') }]}
            >
              <Input.TextArea placeholder={t('enter_address', 'Enter address')} rows={2} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="department"
              label={t('department', 'Department')}
              rules={[{ required: true, message: t('select_department', 'Please select department') }]}
            >
              <Select placeholder={t('select_department', 'Select department')}>
                <Option value="Cardiology">Cardiology</Option>
                <Option value="Neurology">Neurology</Option>
                <Option value="Pediatrics">Pediatrics</Option>
                <Option value="Orthopedics">Orthopedics</Option>
                <Option value="Dermatology">Dermatology</Option>
                <Option value="Obstetrics">Obstetrics</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="doctor"
              label={t('primary_doctor', 'Primary Doctor')}
              rules={[{ required: true, message: t('select_doctor', 'Please select doctor') }]}
            >
              <Select placeholder={t('select_doctor', 'Select doctor')}>
                <Option value="Dr. Smith">Dr. Smith</Option>
                <Option value="Dr. Johnson">Dr. Johnson</Option>
                <Option value="Dr. Williams">Dr. Williams</Option>
                <Option value="Dr. Brown">Dr. Brown</Option>
                <Option value="Dr. Davis">Dr. Davis</Option>
                <Option value="Dr. Miller">Dr. Miller</Option>
                <Option value="Dr. Martinez">Dr. Martinez</Option>
                <Option value="Dr. Anderson">Dr. Anderson</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label={t('status', 'Status')}
              rules={[{ required: true, message: t('select_status', 'Please select status') }]}
            >
              <Select placeholder={t('select_status', 'Select status')}>
                <Option value="Active">{t('active', 'Active')}</Option>
                <Option value="Pending">{t('pending', 'Pending')}</Option>
                <Option value="Review">{t('review', 'Review')}</Option>
                <Option value="Discharged">{t('discharged', 'Discharged')}</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="insurance"
              label={t('insurance_provider', 'Insurance Provider')}
            >
              <Input placeholder={t('insurance_provider', 'Enter insurance provider')} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="emergencyContact"
              label={t('emergency_contact', 'Emergency Contact')}
            >
              <Input placeholder="Name - Phone number" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="allergies"
              label={t('allergies', 'Allergies')}
            >
              <Select mode="tags" placeholder={t('allergies', 'Enter allergies (comma separated)')}>
                <Option value="None">None</Option>
                <Option value="Penicillin">Penicillin</Option>
                <Option value="Sulfa Drugs">Sulfa Drugs</Option>
                <Option value="Latex">Latex</Option>
                <Option value="Peanuts">Peanuts</Option>
                <Option value="Shellfish">Shellfish</Option>
                <Option value="Dust">Dust</Option>
                <Option value="Morphine">Morphine</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="nextAppointment"
              label={t('next_appointment', 'Next Appointment')}
            >
              <DatePicker style={{ width: '100%' }} placeholder={t('select_date', 'Select date')} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="notes"
              label={t('medical_notes', 'Medical Notes')}
            >
              <Input.TextArea placeholder={t('medical_notes', 'Enter medical notes')} rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      {/* Header */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <div>
          <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
            {t(module.key || moduleKey, module.label || 'Clinic')}
            {menu?.groupPath?.length ? ` / ${menu.groupPath.map(p => t(p, p)).join(' / ')}` : ''}
          </Text>
          <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>
            {t(menu?.key || menuKey, menu?.label || module.label || 'Patients')}
          </Title>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            style={{ borderRadius: 10, background: module.accent, border: 'none' }}
            onClick={handleAddPatient}
          >
            {t('new_patient', 'New Patient')}
          </Button>
        </Space>
      </Flex>

      {/* Module Info Card */}
      <Card
        style={{
          borderRadius: 18,
          border: `1px solid ${adminTheme.border}`,
          background: adminTheme.isDark ? `linear-gradient(140deg, #161f30 0%, ${module.accent}20)` : `linear-gradient(140deg, #ffffff, ${module.accent}14)`,
        }}
        styles={{ body: { padding: 22 } }}
      >
        <Row gutter={[20, 16]} align="middle">
          <Col xs={24} md={16}>
            <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
              <Tag
                style={{
                  margin: 0,
                  borderRadius: 999,
                  border: 'none',
                  background: tone.bg,
                  color: tone.color,
                  fontWeight: 700,
                  padding: '4px 12px',
                }}
              >
                <CheckCircleFilled style={{ marginRight: 6 }} />
                {moduleHealthLabel[module.health]}
              </Tag>
              <Badge
                color={module.accent}
                text={
                  <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
                    {module.kpiLabel}: {module.kpiValue}
                  </Text>
                }
              />
            </Flex>
            <Text style={{ color: adminTheme.text, fontSize: 14 }}>
              {module.description}
            </Text>
            <Text
              style={{
                color: adminTheme.subtext,
                fontSize: 12.5,
                display: 'block',
                marginTop: 6,
              }}
            >
              {module.statusNote}
            </Text>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {(module.detailBullets || []).map((bullet) => (
                <Flex key={bullet} align="flex-start" gap={8}>
                  <CheckCircleFilled
                    style={{ color: module.accent, fontSize: 13, marginTop: 3 }}
                  />
                  <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
                    {bullet}
                  </Text>
                </Flex>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, background: adminTheme.card }}>
            <Statistic
              title={t('total_patients', 'Total Patients')}
              value={stats.total}
              prefix={<TeamOutlined style={{ color: module.accent }} />}
              valueStyle={{ color: adminTheme.text }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, background: adminTheme.card }}>
            <Statistic
              title={t('active', 'Active')}
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleFilled />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, background: adminTheme.card }}>
            <Statistic
              title={t('pending', 'Pending')}
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, background: adminTheme.card }}>
            <Statistic
              title={t('under_review', 'Under Review')}
              value={stats.review}
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Patients Table */}
      <Card
        style={{
          borderRadius: 18,
          border: `1px solid ${adminTheme.border}`,
          background: adminTheme.card,
        }}
        styles={{ body: { padding: 20 } }}
      >
        {/* Toolbar */}
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={12}
          style={{ marginBottom: 16 }}
        >
          <Flex gap={12} wrap="wrap" align="center">
            <Search
              placeholder={t('search_patients_placeholder', 'Search patients...')}
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 140 }}
              placeholder={t('status', 'Status')}
            >
              <Option value="all">{t('all_status', 'All Status')}</Option>
              <Option value="Active">{t('active', 'Active')}</Option>
              <Option value="Pending">{t('pending', 'Pending')}</Option>
              <Option value="Review">{t('review', 'Review')}</Option>
              <Option value="Discharged">{t('discharged', 'Discharged')}</Option>
            </Select>
            <Select
              value={filterDepartment}
              onChange={setFilterDepartment}
              style={{ width: 160 }}
              placeholder={t('department', 'Department')}
            >
              <Option value="all">{t('all_departments', 'All Departments')}</Option>
              {departments.filter(d => d !== 'all').map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
            {selectedRowKeys.length > 0 && (
              <Text style={{ color: adminTheme.subtext, fontSize: 13 }}>
                {selectedRowKeys.length} {t('selected', 'selected')}
              </Text>
            )}
          </Flex>
          <Space>
            <Tooltip title={t('refresh', 'Refresh')}>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} />
            </Tooltip>
            <Tooltip title={t('export', 'Export')}>
              <Button icon={<DownloadOutlined />} onClick={handleExport} />
            </Tooltip>
            <Tooltip title={t('print', 'Print')}>
              <Button icon={<PrinterOutlined />} onClick={handlePrint} />
            </Tooltip>
          </Space>
        </Flex>

        {/* Table */}
        {filteredPatients.length ? (
          <Table
            columns={columns}
            dataSource={filteredPatients}
            rowKey="id"
            rowSelection={rowSelection}
            loading={loading}
            pagination={{
              total: filteredPatients.length,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `${t('total', 'Total')} ${total} ${t('patients', 'patients')}`,
              pageSizeOptions: ['10', '20', '50', '100'],
              defaultPageSize: 10,
            }}
            scroll={{ x: 1300 }}
            size="middle"
          />
        ) : (
          <Empty
            description={
              <span>
                {t('no_patients_found', 'No patients found.')} <a onClick={handleAddPatient}>{t('add_new_patient', 'Add a new patient')}</a>
              </span>
            }
          />
        )}
      </Card>

      {/* Modal */}
      <Modal
        title={
          modalMode === 'view'
            ? t('patient_details', 'Patient Details')
            : modalMode === 'delete'
              ? t('delete_patient', 'Delete Patient')
              : selectedPatient
                ? t('edit_patient', 'Edit Patient')
                : t('add_new_patient', 'Add New Patient')
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={modalMode === 'view' ? 800 : 700}
        okText={
          modalMode === 'view'
            ? t('close', 'Close')
            : modalMode === 'delete'
              ? t('delete', 'Delete')
              : t('save', 'Save')
        }
        okButtonProps={{
          danger: modalMode === 'delete',
          style: modalMode !== 'delete' && modalMode !== 'view'
            ? { background: module.accent, borderColor: module.accent }
            : undefined,
        }}
        cancelText={modalMode === 'view' ? t('close', 'Close') : t('cancel', 'Cancel')}
        cancelButtonProps={{
          style: modalMode === 'view' ? { display: 'none' } : undefined,
        }}
        footer={modalMode === 'view' ? [
          <Button key="close" onClick={handleModalCancel}>
            {t('close', 'Close')}
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            style={{ background: module.accent, borderColor: module.accent }}
            onClick={() => {
              setModalMode('edit');
              form.setFieldsValue({
                ...selectedPatient,
                dateOfBirth: dayjs(selectedPatient.dateOfBirth),
                nextAppointment: dayjs(selectedPatient.nextAppointment),
              });
            }}
          >
            {t('edit_patient', 'Edit Patient')}
          </Button>,
        ] : undefined}
        styles={{
          body: {
            maxHeight: '70vh',
            overflow: 'auto',
          },
        }}
      >
        {renderModalContent()}
      </Modal>
    </Space>
  );
};

export default Patients;