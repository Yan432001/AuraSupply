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

// Mock patient data with more comprehensive information
const mockPatients = [
  {
    id: '#PAT-1001',
    name: 'Sarah Johnson',
    gender: 'Female',
    age: 34,
    dateOfBirth: '1990-05-15',
    phone: '+1 (555) 123-4567',
    email: 'sarah.j@email.com',
    address: '123 Main St, New York, NY 10001',
    status: 'Active',
    bloodType: 'A+',
    allergies: ['Penicillin', 'Dust'],
    lastVisit: '2 hours ago',
    nextAppointment: '2024-01-20',
    doctor: 'Dr. Smith',
    department: 'Cardiology',
    avatar: 'SJ',
    insurance: 'Blue Cross',
    emergencyContact: 'John Johnson - +1 (555) 987-6543',
    medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
    currentMedications: ['Lisinopril 10mg', 'Metformin 500mg'],
    notes: 'Patient responds well to treatment. Regular follow-ups required.',
    visits: [
      { date: '2024-01-15', type: 'Follow-up', doctor: 'Dr. Smith', notes: 'Blood pressure stable' },
      { date: '2024-01-10', type: 'Consultation', doctor: 'Dr. Smith', notes: 'Initial assessment' },
    ],
  },
  {
    id: '#PAT-1002',
    name: 'Michael Chen',
    gender: 'Male',
    age: 45,
    dateOfBirth: '1979-08-22',
    phone: '+1 (555) 234-5678',
    email: 'michael.c@email.com',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    status: 'Active',
    bloodType: 'O-',
    allergies: ['None'],
    lastVisit: 'Yesterday',
    nextAppointment: '2024-01-18',
    doctor: 'Dr. Johnson',
    department: 'Neurology',
    avatar: 'MC',
    insurance: 'Aetna',
    emergencyContact: 'Lisa Chen - +1 (555) 876-5432',
    medicalHistory: ['Migraine', 'Chronic Back Pain'],
    currentMedications: ['Sumatriptan 50mg', 'Gabapentin 300mg'],
    notes: 'Scheduled for MRI next week.',
    visits: [
      { date: '2024-01-17', type: 'Follow-up', doctor: 'Dr. Johnson', notes: 'MRI scheduled' },
    ],
  },
  {
    id: '#PAT-1003',
    name: 'Emily Rodriguez',
    gender: 'Female',
    age: 28,
    dateOfBirth: '1996-03-10',
    phone: '+1 (555) 345-6789',
    email: 'emily.r@email.com',
    address: '789 Pine St, Miami, FL 33101',
    status: 'Pending',
    bloodType: 'B+',
    allergies: ['Shellfish'],
    lastVisit: '3 days ago',
    nextAppointment: '2024-01-22',
    doctor: 'Dr. Williams',
    department: 'Pediatrics',
    avatar: 'ER',
    insurance: 'UnitedHealth',
    emergencyContact: 'Maria Rodriguez - +1 (555) 765-4321',
    medicalHistory: ['Asthma'],
    currentMedications: ['Albuterol Inhaler'],
    notes: 'New patient. Initial assessment completed.',
    visits: [
      { date: '2024-01-19', type: 'Initial', doctor: 'Dr. Williams', notes: 'Asthma assessment' },
    ],
  },
  {
    id: '#PAT-1004',
    name: 'David Kim',
    gender: 'Male',
    age: 52,
    dateOfBirth: '1972-11-30',
    phone: '+1 (555) 456-7890',
    email: 'david.k@email.com',
    address: '321 Elm Blvd, Chicago, IL 60601',
    status: 'Review',
    bloodType: 'AB+',
    allergies: ['Latex'],
    lastVisit: '5 days ago',
    nextAppointment: '2024-01-25',
    doctor: 'Dr. Brown',
    department: 'Orthopedics',
    avatar: 'DK',
    insurance: 'Cigna',
    emergencyContact: 'Amy Kim - +1 (555) 654-3210',
    medicalHistory: ['Arthritis', 'Knee Surgery'],
    currentMedications: ['Ibuprofen 400mg', 'Omeprazole 20mg'],
    notes: 'Post-surgery recovery progress is good.',
    visits: [
      { date: '2024-01-20', type: 'Surgery Follow-up', doctor: 'Dr. Brown', notes: 'Recovery on track' },
    ],
  },
  {
    id: '#PAT-1005',
    name: 'Lisa Thompson',
    gender: 'Female',
    age: 31,
    dateOfBirth: '1993-07-18',
    phone: '+1 (555) 567-8901',
    email: 'lisa.t@email.com',
    address: '654 Cedar Ln, Seattle, WA 98101',
    status: 'Active',
    bloodType: 'A-',
    allergies: ['Peanuts'],
    lastVisit: '1 week ago',
    nextAppointment: '2024-01-28',
    doctor: 'Dr. Davis',
    department: 'Dermatology',
    avatar: 'LT',
    insurance: 'Humana',
    emergencyContact: 'Mark Thompson - +1 (555) 543-2109',
    medicalHistory: ['Eczema', 'Skin Allergies'],
    currentMedications: ['Hydrocortisone Cream'],
    notes: 'Skin condition improving with treatment.',
    visits: [
      { date: '2024-01-14', type: 'Treatment', doctor: 'Dr. Davis', notes: 'Prescribed new cream' },
    ],
  },
  {
    id: '#PAT-1006',
    name: 'James Wilson',
    gender: 'Male',
    age: 67,
    dateOfBirth: '1957-09-05',
    phone: '+1 (555) 678-9012',
    email: 'james.w@email.com',
    address: '987 Maple Dr, Boston, MA 02101',
    status: 'Pending',
    bloodType: 'O+',
    allergies: ['Sulfa Drugs'],
    lastVisit: '2 weeks ago',
    nextAppointment: '2024-02-01',
    doctor: 'Dr. Miller',
    department: 'Cardiology',
    avatar: 'JW',
    insurance: 'Medicare',
    emergencyContact: 'Anne Wilson - +1 (555) 432-1098',
    medicalHistory: ['Heart Attack', 'High Cholesterol'],
    currentMedications: ['Atorvastatin 20mg', 'Aspirin 81mg'],
    notes: 'Requires regular heart monitoring.',
    visits: [
      { date: '2024-01-08', type: 'Cardiac Check', doctor: 'Dr. Miller', notes: 'EKG performed' },
    ],
  },
  {
    id: '#PAT-1007',
    name: 'Maria Garcia',
    gender: 'Female',
    age: 29,
    dateOfBirth: '1995-12-25',
    phone: '+1 (555) 789-0123',
    email: 'maria.g@email.com',
    address: '147 Birch St, Denver, CO 80201',
    status: 'Active',
    bloodType: 'B-',
    allergies: ['Penicillin'],
    lastVisit: '3 days ago',
    nextAppointment: '2024-01-19',
    doctor: 'Dr. Martinez',
    department: 'Obstetrics',
    avatar: 'MG',
    insurance: 'Kaiser Permanente',
    emergencyContact: 'Carlos Garcia - +1 (555) 321-0987',
    medicalHistory: ['Pregnancy', 'Gestational Diabetes'],
    currentMedications: ['Prenatal Vitamins'],
    notes: 'Due date: March 2024',
    visits: [
      { date: '2024-01-17', type: 'Prenatal', doctor: 'Dr. Martinez', notes: 'Baby developing well' },
    ],
  },
  {
    id: '#PAT-1008',
    name: 'Robert Taylor',
    gender: 'Male',
    age: 41,
    dateOfBirth: '1983-04-14',
    phone: '+1 (555) 890-1234',
    email: 'robert.t@email.com',
    address: '258 Spruce Ct, San Francisco, CA 94101',
    status: 'Review',
    bloodType: 'AB-',
    allergies: ['Morphine'],
    lastVisit: '6 days ago',
    nextAppointment: '2024-01-24',
    doctor: 'Dr. Anderson',
    department: 'Neurology',
    avatar: 'RT',
    insurance: 'Blue Shield',
    emergencyContact: 'Jennifer Taylor - +1 (555) 210-9876',
    medicalHistory: ['Epilepsy', 'TBI'],
    currentMedications: ['Levetiracetam 500mg'],
    notes: 'Seizure frequency has decreased significantly.',
    visits: [
      { date: '2024-01-16', type: 'Neurology Review', doctor: 'Dr. Anderson', notes: 'Good progress' },
    ],
  },
];

const statusColor = {
  Active: 'green',
  Pending: 'gold',
  Review: 'blue',
  Discharged: 'gray',
};

const Patients = () => {
  const adminTheme = useAdminTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const moduleKey = searchParams.get('module') || 'clinic';
  const menuKey = searchParams.get('menu') || 'patients';

  const module = useMemo(() => getModuleByKey(moduleKey), [moduleKey]);
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
  const [patients, setPatients] = useState(mockPatients);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('1');
  const [form] = Form.useForm();

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
      title: 'Patient ID',
      dataIndex: 'id',
      key: 'id',
      render: (v) => <Text strong style={{ color: module.accent }}>{v}</Text>,
      sorter: (a, b) => a.id.localeCompare(b.id),
      width: 120,
    },
    {
      title: 'Patient',
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
                {' '}{record.age} yrs
              </Text>
            </div>
          </div>
        </Flex>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 200,
    },
    {
      title: 'Contact',
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
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (v) => <Tag color="blue" style={{ borderRadius: 4 }}>{v}</Tag>,
      width: 130,
    },
    {
      title: 'Doctor',
      dataIndex: 'doctor',
      key: 'doctor',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={statusColor[v]} style={{ borderRadius: 999 }}>
          <CheckCircleFilled style={{ marginRight: 4, fontSize: 11 }} />
          {v}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Pending', value: 'Pending' },
        { text: 'Review', value: 'Review' },
        { text: 'Discharged', value: 'Discharged' },
      ],
      onFilter: (value, record) => record.status === value,
      width: 120,
    },
    {
      title: 'Last Visit',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      sorter: (a, b) => a.lastVisit.localeCompare(b.lastVisit),
      width: 130,
    },
    {
      title: 'Next Appointment',
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
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewPatient(record)}
              style={{ color: adminTheme.primary }}
            />
          </Tooltip>
          <Tooltip title="Edit">
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
                  label: 'View Details',
                  icon: <EyeOutlined />,
                  onClick: () => handleViewPatient(record),
                },
                {
                  key: 'edit',
                  label: 'Edit Patient',
                  icon: <EditOutlined />,
                  onClick: () => handleEditPatient(record),
                },
                {
                  key: 'delete',
                  label: 'Delete Patient',
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
      message.success('Patient deleted successfully');
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
        message.success('Patient updated successfully');
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
    message.success('Export started. File will be ready shortly.');
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setPatients([...mockPatients]);
      setLoading(false);
      message.success('Data refreshed');
    }, 800);
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
                {selectedPatient.status}
              </Tag>
            </Flex>
            <Flex gap={16} style={{ marginTop: 8 }}>
              <Text><UserOutlined /> {selectedPatient.gender}, {selectedPatient.age} years</Text>
              <Text><CalendarOutlined /> DOB: {selectedPatient.dateOfBirth}</Text>
              <Text><HeartOutlined /> Blood: {selectedPatient.bloodType}</Text>
            </Flex>
          </div>
        </Flex>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="1">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small" title="Contact Information">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Phone">{selectedPatient.phone}</Descriptions.Item>
                    <Descriptions.Item label="Email">{selectedPatient.email}</Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>{selectedPatient.address}</Descriptions.Item>
                    <Descriptions.Item label="Insurance">{selectedPatient.insurance}</Descriptions.Item>
                    <Descriptions.Item label="Emergency Contact">{selectedPatient.emergencyContact}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Medical Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Blood Type">{selectedPatient.bloodType}</Descriptions.Item>
                    <Descriptions.Item label="Allergies">
                      {selectedPatient.allergies?.join(', ') || 'None'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Medical History">
                      {selectedPatient.medicalHistory?.join(', ') || 'None'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Current Medications">
                  <List
                    size="small"
                    dataSource={selectedPatient.currentMedications || []}
                    renderItem={(item) => (
                      <List.Item>
                        <MedicineBoxOutlined style={{ marginRight: 8, color: module.accent }} />
                        {item}
                      </List.Item>
                    )}
                    locale={{ emptyText: 'No medications prescribed' }}
                  />
                </Card>
              </Col>
              <Col span={24}>
                <Card size="small" title="Visit History">
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
                    })) || [{ children: 'No visits recorded' }]}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane tab="Medical History" key="2">
            <Card size="small">
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Blood Type">{selectedPatient.bloodType}</Descriptions.Item>
                <Descriptions.Item label="Allergies">
                  {selectedPatient.allergies?.join(', ') || 'None'}
                </Descriptions.Item>
                <Descriptions.Item label="Medical History">
                  {selectedPatient.medicalHistory?.join(', ') || 'None'}
                </Descriptions.Item>
                <Descriptions.Item label="Current Medications">
                  {selectedPatient.currentMedications?.join(', ') || 'None'}
                </Descriptions.Item>
                <Descriptions.Item label="Notes">{selectedPatient.notes}</Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
          
          <TabPane tab="Appointments" key="3">
            <Card size="small">
              <Descriptions column={2}>
                <Descriptions.Item label="Last Visit">{selectedPatient.lastVisit}</Descriptions.Item>
                <Descriptions.Item label="Next Appointment">
                  <Tag color="blue">{selectedPatient.nextAppointment}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Primary Doctor">{selectedPatient.doctor}</Descriptions.Item>
                <Descriptions.Item label="Department">{selectedPatient.department}</Descriptions.Item>
              </Descriptions>
              
              <Divider />
              <Title level={5}>Visit History</Title>
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
                })) || [{ children: 'No visits recorded' }]}
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
          <Title level={4}>Delete Patient</Title>
          <Text>
            Are you sure you want to delete patient <strong>{selectedPatient?.name}</strong>?
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>
              This action cannot be undone.
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
              label="Full Name"
              rules={[{ required: true, message: 'Please enter patient name' }]}
            >
              <Input placeholder="Enter patient name" prefix={<UserOutlined />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Please select gender' }]}
            >
              <Select placeholder="Select gender">
                <Option value="Male"><ManOutlined /> Male</Option>
                <Option value="Female"><WomanOutlined /> Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dateOfBirth"
              label="Date of Birth"
              rules={[{ required: true, message: 'Please select date of birth' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="Select date" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="bloodType"
              label="Blood Type"
              rules={[{ required: true, message: 'Please select blood type' }]}
            >
              <Select placeholder="Select blood type">
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
              label="Phone"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="Enter phone number" prefix={<PhoneOutlined />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input placeholder="Enter email address" prefix={<MailOutlined />} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: 'Please enter address' }]}
            >
              <Input.TextArea placeholder="Enter address" rows={2} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Please select department' }]}
            >
              <Select placeholder="Select department">
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
              label="Primary Doctor"
              rules={[{ required: true, message: 'Please select doctor' }]}
            >
              <Select placeholder="Select doctor">
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
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                <Option value="Active">Active</Option>
                <Option value="Pending">Pending</Option>
                <Option value="Review">Review</Option>
                <Option value="Discharged">Discharged</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="insurance"
              label="Insurance Provider"
            >
              <Input placeholder="Enter insurance provider" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="emergencyContact"
              label="Emergency Contact"
            >
              <Input placeholder="Name - Phone number" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="allergies"
              label="Allergies"
            >
              <Select mode="tags" placeholder="Enter allergies (comma separated)">
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
              label="Next Appointment"
            >
              <DatePicker style={{ width: '100%' }} placeholder="Select date" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="notes"
              label="Medical Notes"
            >
              <Input.TextArea placeholder="Enter medical notes" rows={3} />
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
            {module.label}
            {menu?.groupPath?.length ? ` / ${menu.groupPath.join(' / ')}` : ''}
          </Text>
          <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>
            {menu?.label || module.label}
          </Title>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            style={{ borderRadius: 10, background: module.accent, border: 'none' }}
            onClick={handleAddPatient}
          >
            New Patient
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
              title="Total Patients"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: module.accent }} />}
              valueStyle={{ color: adminTheme.text }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, background: adminTheme.card }}>
            <Statistic
              title="Active"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleFilled />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, background: adminTheme.card }}>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, background: adminTheme.card }}>
            <Statistic
              title="Under Review"
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
              placeholder="Search patients..."
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 140 }}
              placeholder="Status"
            >
              <Option value="all">All Status</Option>
              <Option value="Active">Active</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Review">Review</Option>
              <Option value="Discharged">Discharged</Option>
            </Select>
            <Select
              value={filterDepartment}
              onChange={setFilterDepartment}
              style={{ width: 160 }}
              placeholder="Department"
            >
              <Option value="all">All Departments</Option>
              {departments.filter(d => d !== 'all').map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
            {selectedRowKeys.length > 0 && (
              <Text style={{ color: adminTheme.subtext, fontSize: 13 }}>
                {selectedRowKeys.length} selected
              </Text>
            )}
          </Flex>
          <Space>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} />
            </Tooltip>
            <Tooltip title="Export">
              <Button icon={<DownloadOutlined />} onClick={handleExport} />
            </Tooltip>
            <Tooltip title="Print">
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
              showTotal: (total) => `Total ${total} patients`,
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
                No patients found. <a onClick={handleAddPatient}>Add a new patient</a>
              </span>
            }
          />
        )}
      </Card>

      {/* Modal */}
      <Modal
        title={
          modalMode === 'view'
            ? 'Patient Details'
            : modalMode === 'delete'
              ? 'Delete Patient'
              : selectedPatient
                ? 'Edit Patient'
                : 'Add New Patient'
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={modalMode === 'view' ? 800 : 700}
        okText={
          modalMode === 'view'
            ? 'Close'
            : modalMode === 'delete'
              ? 'Delete'
              : 'Save'
        }
        okButtonProps={{
          danger: modalMode === 'delete',
          style: modalMode !== 'delete' && modalMode !== 'view'
            ? { background: module.accent, borderColor: module.accent }
            : undefined,
        }}
        cancelText={modalMode === 'view' ? 'Close' : 'Cancel'}
        cancelButtonProps={{
          style: modalMode === 'view' ? { display: 'none' } : undefined,
        }}
        footer={modalMode === 'view' ? [
          <Button key="close" onClick={handleModalCancel}>
            Close
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
            Edit Patient
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