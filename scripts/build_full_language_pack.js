/**
 * Comprehensive Multilingual Dictionary Builder for Aura Supply ERP & Website
 * Inserts / Updates all ERP modules, menus, website components, and actions
 * across Khmer 🇰🇭, English 🇺🇸, Simplified Chinese 🇨🇳, Thai 🇹🇭, Vietnamese 🇻🇳.
 */

const { db } = require('../API/app/config/utill/helper');
const fs = require('fs');

const TRANSLATIONS_DATA = [
  // ==========================================
  // 1. ERP MODULES & SUBMODULES
  // ==========================================
  {
    code: 'inventory',
    english: 'Inventory',
    khmer: 'ផលិតផល និងស្តុក',
    chinese: '库存管理',
    thai: 'คลังสินค้า',
    vietnamese: 'Kho hàng'
  },
  {
    code: 'procurement',
    english: 'Procurement',
    khmer: 'ការទិញទំនិញ',
    chinese: '采购管理',
    thai: 'การจัดซื้อ',
    vietnamese: 'Mua hàng'
  },
  {
    code: 'sales',
    english: 'Sales',
    khmer: 'ការលក់',
    chinese: '销售管理',
    thai: 'การขาย',
    vietnamese: 'Bán hàng'
  },
  {
    code: 'pos',
    english: 'POS',
    khmer: 'ភីអូអេស (POS)',
    chinese: 'POS点餐收银',
    thai: 'จุดขาย (POS)',
    vietnamese: 'Điểm bán hàng (POS)'
  },
  {
    code: 'asset',
    english: 'Asset Management',
    khmer: 'ទ្រព្យសកម្ម',
    chinese: '固定资产',
    thai: 'สินทรัพย์',
    vietnamese: 'Tài sản cố định'
  },
  {
    code: 'leasing',
    english: 'Leasing / Vehicles',
    khmer: 'ការជួលទិញ និងយានយន្ត',
    chinese: '车辆租赁',
    thai: 'การเช่าซื้อยานพาหนะ',
    vietnamese: 'Cho thuê xe cộ'
  },
  {
    code: 'store_sales',
    english: 'Store Sales',
    khmer: 'ការលក់តាមហាង',
    chinese: '门店销售',
    thai: 'ยอดขายหน้าร้าน',
    vietnamese: 'Bán hàng tại cửa hàng'
  },
  {
    code: 'repairs',
    english: 'Repairs & Maintenance',
    khmer: 'ការជួសជុល និងថែទាំ',
    chinese: '维修与维护',
    thai: 'การซ่อมแซมและบำรุงรักษา',
    vietnamese: 'Sửa chữa & Bảo trì'
  },
  {
    code: 'concretes',
    english: 'Concretes & Cement',
    khmer: 'បេតុង និងស៊ីម៉ង់ត៍',
    chinese: '混凝土管理',
    thai: 'คอนกรีตและซีเมนต์',
    vietnamese: 'Bê tông & Xi măng'
  },
  {
    code: 'truckings',
    english: 'Trucking & Logistics',
    khmer: 'ដឹកជញ្ជូនទំនិញ',
    chinese: '物流车队',
    thai: 'ขนส่งและโลจิสติกส์',
    vietnamese: 'Vận tải & Hậu cần'
  },
  {
    code: 'clearances',
    english: 'Customs Clearances',
    khmer: 'ការបោសសម្អាតគយ',
    chinese: '报关清关',
    thai: 'พิธีการทางศุลกากร',
    vietnamese: 'Thông quan hải quan'
  },
  {
    code: 'projects',
    english: 'Projects & Construction',
    khmer: 'គម្រោង និងសំណង់',
    chinese: '项目管理',
    thai: 'การจัดการโครงการ',
    vietnamese: 'Quản lý dự án'
  },
  {
    code: 'workorder',
    english: 'Work Orders & Manufacturing',
    khmer: 'បញ្ជាការងារផលិត',
    chinese: '生产工单',
    thai: 'ใบสั่งงานและผลิต',
    vietnamese: 'Lệnh sản xuất'
  },
  {
    code: 'clinic',
    english: 'Clinic & Healthcare',
    khmer: 'គ្លីនិក និងសុខភាព',
    chinese: '诊所医疗',
    thai: 'คลินิกและการแพทย์',
    vietnamese: 'Phòng khám y tế'
  },
  {
    code: 'schools',
    english: 'Schools & Education',
    khmer: 'សាលារៀន និងការអប់រំ',
    chinese: '学校教育',
    thai: 'โรงเรียนและการศึกษา',
    vietnamese: 'Trường học & Giáo dục'
  },
  {
    code: 'rooms',
    english: 'Rooms & Hospitality',
    khmer: 'បន្ទប់ និងសណ្ឋាគារ',
    chinese: '酒店客房',
    thai: 'ห้องพักและการบริการ',
    vietnamese: 'Khách sạn & Phòng nghỉ'
  },
  {
    code: 'tickets',
    english: 'Tickets & Travel',
    khmer: 'សំបុត្រ និងការធ្វើដំណើរ',
    chinese: '票务客运',
    thai: 'การจองตั๋วและเดินทาง',
    vietnamese: 'Vé & Vận tải hành khách'
  },
  {
    code: 'gym',
    english: 'Gym & Fitness',
    khmer: 'ក្លឹបហាត់ប្រាណ',
    chinese: '健身俱乐部',
    thai: 'ฟิตเนสและยิม',
    vietnamese: 'Phòng tập thể hình'
  },
  {
    code: 'crm',
    english: 'CRM & Customers',
    khmer: 'អតិថិជន និងទំនាក់ទំនង (CRM)',
    chinese: '客户关系CRM',
    thai: 'ลูกค้าสัมพันธ์ (CRM)',
    vietnamese: 'Khách hàng & CRM'
  },
  {
    code: 'people',
    english: 'People Directory',
    khmer: 'បញ្ជីមនុស្ស និងដៃគូ',
    chinese: '联系人名册',
    thai: 'สมุดรายชื่อผู้ติดต่อ',
    vietnamese: 'Danh bạ đối tác'
  },
  {
    code: 'hr',
    english: 'Human Resources',
    khmer: 'ធនធានមនុស្ស',
    chinese: '人力资源',
    thai: 'ทรัพยากรบุคคล',
    vietnamese: 'Nhân sự'
  },
  {
    code: 'attendance',
    english: 'Attendance & Time',
    khmer: 'វត្តមាន និងម៉ោងធ្វើការ',
    chinese: '考勤打卡',
    thai: 'เวลาและการเข้างาน',
    vietnamese: 'Chấm công'
  },
  {
    code: 'payroll',
    english: 'Payroll & Salaries',
    khmer: 'ប្រាក់បៀវត្សរ៍',
    chinese: '薪资结算',
    thai: 'เงินเดือนและค่าตอบแทน',
    vietnamese: 'Bảng lương'
  },
  {
    code: 'accounting',
    english: 'Accounting & Ledger',
    khmer: 'គណនេយ្យទូទៅ',
    chinese: '财务会计',
    thai: 'บัญชีและการเงิน',
    vietnamese: 'Kế toán'
  },
  {
    code: 'loans',
    english: 'Loans & Microfinance',
    khmer: 'ប្រាក់កម្ចី និងឥណទាន',
    chinese: '贷款金融',
    thai: 'สินเชื่อและไมโครไฟแนนซ์',
    vietnamese: 'Cho vay & Tín dụng'
  },
  {
    code: 'pawns',
    english: 'Pawnshop & Collateral',
    khmer: 'ហាងបញ្ចាំ និងទ្រព្យបញ្ចាំ',
    chinese: '典当抵押',
    thai: 'โรงรับจำนำ',
    vietnamese: 'Tiệm cầm đồ'
  },
  {
    code: 'savings',
    english: 'Savings & Deposits',
    khmer: 'ប្រាក់បញ្ញើ និងសន្សំ',
    chinese: '储蓄存款',
    thai: 'เงินฝากและการออม',
    vietnamese: 'Tiền gửi & Tiết kiệm'
  },
  {
    code: 'installments',
    english: 'Installment Plans',
    khmer: 'ការបង់រំលស់',
    chinese: '分期付款',
    thai: 'การผ่อนชำระ',
    vietnamese: 'Trả góp'
  },
  {
    code: 'property',
    english: 'Property & Real Estate',
    khmer: 'អចលនទ្រព្យ',
    chinese: '房地产物业',
    thai: 'อสังหาริมทรัพย์',
    vietnamese: 'Bất động sản'
  },
  {
    code: 'commission',
    english: 'Commission & Agent',
    khmer: 'កម្រៃជើងសារ',
    chinese: '代理佣金',
    thai: 'ค่านายหน้าและตัวแทน',
    vietnamese: 'Hoa hồng đại lý'
  },
  {
    code: 'money_change',
    english: 'Money Exchange',
    khmer: 'ប្តូរប្រាក់ និងរូបិយប័ណ្ណ',
    chinese: '货币兑换',
    thai: 'แลกเปลี่ยนเงินตรา',
    vietnamese: 'Đổi tiền tệ'
  },
  {
    code: 'tax',
    english: 'Tax & Regulatory',
    khmer: 'ពន្ធដារ និងកាតព្វកិច្ច',
    chinese: '税务申报',
    thai: 'ภาษีและข้อบังคับ',
    vietnamese: 'Thuế'
  },
  {
    code: 'expenses',
    english: 'Expenses & Petty Cash',
    khmer: 'ការចំណាយទូទៅ',
    chinese: '费用支出',
    thai: 'ค่าใช้จ่าย',
    vietnamese: 'Chi phí'
  },
  {
    code: 'companies',
    english: 'Companies & Billers',
    khmer: 'ក្រុមហ៊ុន និងសាខាចេញវិក្កយបត្រ',
    chinese: '公司与开票方',
    thai: 'บริษัทและผู้ออกบิล',
    vietnamese: 'Công ty & Đơn vị xuất hóa đơn'
  },
  {
    code: 'calendar',
    english: 'Calendar & Schedules',
    khmer: 'ប្រតិទិនការងារ',
    chinese: '日程日历',
    thai: 'ปฏิทินงาน',
    vietnamese: 'Lịch công việc'
  },
  {
    code: 'reports',
    english: 'Reports & Analytics',
    khmer: 'របាយការណ៍ និងការវិភាគ',
    chinese: '报表与分析',
    thai: 'รายงานและการวิเคราะห์',
    vietnamese: 'Báo cáo & Phân tích'
  },
  {
    code: 'settings',
    english: 'System Settings',
    khmer: 'ការកំណត់ប្រព័ន្ធ',
    chinese: '系统设置',
    thai: 'การตั้งค่าระบบ',
    vietnamese: 'Cài đặt hệ thống'
  },
  {
    code: 'cms',
    english: 'Website CMS',
    khmer: 'គ្រប់គ្រងមាតិកាគេហទំព័រ (CMS)',
    chinese: '网站内容管理',
    thai: 'ระบบจัดการเนื้อหา (CMS)',
    vietnamese: 'Quản lý nội dung (CMS)'
  },
  {
    code: 'front-end',
    english: 'Front-End Storefront',
    khmer: 'គេហទំព័រលក់ខាងមុខ',
    chinese: '前端商城',
    thai: 'หน้าร้านค้าออนไลน์',
    vietnamese: 'Giao diện cửa hàng'
  },
  {
    code: 'access-control',
    english: 'Access Control',
    khmer: 'ការគ្រប់គ្រងសិទ្ធិ (Access Control)',
    chinese: '权限管理',
    thai: 'การควบคุมการเข้าถึง',
    vietnamese: 'Kiểm soát quyền truy cập'
  },

  // ==========================================
  // 2. INVENTORY & PRODUCTS SUBMENUS
  // ==========================================
  {
    code: 'products',
    english: 'List Products',
    khmer: 'បញ្ជីទំនិញ',
    chinese: '产品列表',
    thai: 'รายการสินค้า',
    vietnamese: 'Danh sách sản phẩm'
  },
  {
    code: 'add-product',
    english: 'Add Product',
    khmer: 'បន្ថែមផលិតផលថ្មី',
    chinese: '添加产品',
    thai: 'เพิ่มสินค้า',
    vietnamese: 'Thêm sản phẩm'
  },
  {
    code: 'import-products',
    english: 'Import Products',
    khmer: 'នាំចូលទំនិញ (Excel)',
    chinese: '导入产品',
    thai: 'นำเข้าสินค้า',
    vietnamese: 'Nhập sản phẩm'
  },
  {
    code: 'print-barcodes',
    english: 'Print Barcode Label',
    khmer: 'បោះពុម្ពបាកូដ',
    chinese: '打印条形码',
    thai: 'พิมพ์บาร์โค้ด',
    vietnamese: 'In mã vạch'
  },
  {
    code: 'stock-counts',
    english: 'Stock Counts',
    khmer: 'ការរាប់ស្តុកទំនិញ',
    chinese: '库存盘点',
    thai: 'การนับสต็อก',
    vietnamese: 'Kiểm kê kho'
  },
  {
    code: 'quantity-adjustments',
    english: 'Quantity Adjustments',
    khmer: 'កែតម្រូវបរិមាណស្តុក',
    chinese: '数量调整',
    thai: 'ปรับปรุงจำนวนสต็อก',
    vietnamese: 'Điều chỉnh số lượng'
  },
  {
    code: 'cost-adjustments',
    english: 'Cost Adjustments',
    khmer: 'កែតម្រូវថ្លៃដើមទំនិញ',
    chinese: '成本调整',
    thai: 'ปรับปรุงต้นทุนสินค้า',
    vietnamese: 'Điều chỉnh giá vốn'
  },
  {
    code: 'using-stock',
    english: 'Stock Using',
    khmer: 'ការប្រើប្រាស់ស្តុកផ្ទៃក្នុង',
    chinese: '内部领料出库',
    thai: 'เบิกใช้สต็อก',
    vietnamese: 'Xuất sử dụng nội bộ'
  },
  {
    code: 'stock-received',
    english: 'Stock Received',
    khmer: 'ទទួលទំនិញចូលស្តុក',
    chinese: '采购收货入库',
    thai: 'รับสินค้าเข้าสต็อก',
    vietnamese: 'Nhận hàng vào kho'
  },
  {
    code: 'transfers',
    english: 'List Transfers',
    khmer: 'បញ្ជីផ្ទេរទំនិញរវាងឃ្លាំង',
    chinese: '库间调拨列表',
    thai: 'รายการโอนย้ายสต็อก',
    vietnamese: 'Danh sách chuyển kho'
  },
  {
    code: 'consignments',
    english: 'Consignments',
    khmer: 'ទំនិញផ្ញើលក់',
    chinese: '寄售代销',
    thai: 'สินค้าฝากขาย',
    vietnamese: 'Ký gửi'
  },
  {
    code: 'rewards-exchange',
    english: 'Rewards Exchange',
    khmer: 'ប្តូរពិន្ទុរង្វាន់',
    chinese: '积分兑换礼品',
    thai: 'แลกของรางวัล',
    vietnamese: 'Đổi điểm thưởng'
  },

  // ==========================================
  // 3. PURCHASES & PROCUREMENT SUBMENUS
  // ==========================================
  {
    code: 'purchase-requests',
    english: 'Purchase Request',
    khmer: 'សំណើរសុំទិញទំនិញ',
    chinese: '采购申请',
    thai: 'ใบขอซื้อ',
    vietnamese: 'Yêu cầu mua hàng'
  },
  {
    code: 'purchase-orders',
    english: 'Purchase Order',
    khmer: 'បញ្ជាទិញទំនិញ (PO)',
    chinese: '采购订单(PO)',
    thai: 'ใบสั่งซื้อ (PO)',
    vietnamese: 'Đơn đặt hàng mua (PO)'
  },
  {
    code: 'purchases-list',
    english: 'List Purchases',
    khmer: 'បញ្ជីការទិញទំនិញ',
    chinese: '采购单列表',
    thai: 'รายการซื้อ',
    vietnamese: 'Danh sách mua hàng'
  },
  {
    code: 'ap-requested',
    english: 'AP Requested',
    khmer: 'សំណើរសុំទូទាត់ប្រាក់ (AP)',
    chinese: '应付账款申请',
    thai: 'คำขอจ่ายเงินเจ้าหนี้ (AP)',
    vietnamese: 'Đề nghị thanh toán (AP)'
  },
  {
    code: 'purchase-returns',
    english: 'Purchase Returns',
    khmer: 'ការបង្វិលទំនិញទិញត្រឡប់',
    chinese: '采购退货',
    thai: 'ส่งคืนสินค้าให้ผู้ขาย',
    vietnamese: 'Trả hàng mua'
  },
  {
    code: 'quotes-comparison',
    english: 'Quotes Comparison',
    khmer: 'ប្រៀបធៀបសម្រង់តម្លៃអ្នកផ្គត់ផ្គង់',
    chinese: '供应商比价',
    thai: 'เปรียบเทียบใบเสนอราคา',
    vietnamese: 'So sánh báo giá'
  },

  // ==========================================
  // 4. SALES & INVOICES SUBMENUS
  // ==========================================
  {
    code: 'sales-order',
    english: 'Sales Orders',
    khmer: 'បញ្ជាលក់ទំនិញ (SO)',
    chinese: '销售订单(SO)',
    thai: 'ใบสั่งขาย (SO)',
    vietnamese: 'Đơn bán hàng (SO)'
  },
  {
    code: 'sales-list',
    english: 'List Sales',
    khmer: 'បញ្ជីការលក់ទំនិញ',
    chinese: '销售单列表',
    thai: 'รายการขาย',
    vietnamese: 'Danh sách đơn bán'
  },
  {
    code: 'monthly-auto-invoice',
    english: 'Monthly Auto Invoice',
    khmer: 'វិក្កយបត្រប្រចាំខែស្វ័យប្រវត្តិ',
    chinese: '月度自动账单',
    thai: 'ใบแจ้งหนี้รายเดือนอัตโนมัติ',
    vietnamese: 'Hóa đơn định kỳ hàng tháng'
  },
  {
    code: 'tax-invoices',
    english: 'List Invoices (Tax)',
    khmer: 'បញ្ជីវិក្កយបត្រពន្ធ (GDT Tax)',
    chinese: '税务发票列表',
    thai: 'ใบกำกับภาษี',
    vietnamese: 'Hóa đơn thuế GTGT'
  },
  {
    code: 'shipping-requests',
    english: 'Shipping Request',
    khmer: 'សំណើរសុំដឹកជញ្ជូន',
    chinese: '发货申请',
    thai: 'คำขอจัดส่งสินค้า',
    vietnamese: 'Yêu cầu giao hàng'
  },
  {
    code: 'sale-returns',
    english: 'List Returns',
    khmer: 'បញ្ជីអតិថិជនបង្វិលទំនិញ',
    chinese: '客户退货列表',
    thai: 'รายการคืนสินค้า',
    vietnamese: 'Khách hàng trả hàng'
  },
  {
    code: 'sale-consignments',
    english: 'Sale Consignments',
    khmer: 'ការលក់ទំនិញផ្ញើ',
    chinese: '代销销售',
    thai: 'การขายสินค้าฝากขาย',
    vietnamese: 'Bán hàng ký gửi'
  },
  {
    code: 'fuel-sales',
    english: 'Fuel Sales',
    khmer: 'ការលក់ប្រេងឥន្ធនៈ',
    chinese: '燃油销售',
    thai: 'การขายน้ำมันเชื้อเพลิง',
    vietnamese: 'Bán xăng dầu'
  },
  {
    code: 'concrete-sales',
    english: 'Sale Concretes',
    khmer: 'ការលក់បេតុងលាយស្រេច',
    chinese: '商品混凝土销售',
    thai: 'การขายคอนกรีตผสมเสร็จ',
    vietnamese: 'Bán bê tông tươi'
  },

  // ==========================================
  // 5. POS TERMINAL & RETAIL SUBMENUS
  // ==========================================
  {
    code: 'pos-screen',
    english: 'Open POS Terminal',
    khmer: 'បើកផ្ទាំងគិតលុយភីអូអេស (POS)',
    chinese: '打开POS收银终端',
    thai: 'เปิดหน้าจอแคชเชียร์ POS',
    vietnamese: 'Mở máy thu ngân POS'
  },
  {
    code: 'member-cards',
    english: 'Member Cards',
    khmer: 'កាតសមាជិក',
    chinese: '会员卡管理',
    thai: 'บัตรสมาชิก',
    vietnamese: 'Thẻ thành viên'
  },
  {
    code: 'coupons',
    english: 'Coupons & Vouchers',
    khmer: 'ប័ណ្ណបញ្ចុះតម្លៃ និងគូប៉ុង',
    chinese: '优惠券与卡券',
    thai: 'คูปองและส่วนลด',
    vietnamese: 'Phiếu giảm giá & Coupon'
  },
  {
    code: 'customer-stocks',
    english: 'Customer Stocks',
    khmer: 'ស្តុកផ្ញើទុករបស់អតិថិជន',
    chinese: '客户暂存库存',
    thai: 'สต็อกฝากของลูกค้า',
    vietnamese: 'Hàng khách gửi lại'
  },

  // ==========================================
  // 6. ASSETS & LEASING SUBMENUS
  // ==========================================
  {
    code: 'assets-list',
    english: 'List Assets',
    khmer: 'បញ្ជីទ្រព្យសកម្ម',
    chinese: '资产列表',
    thai: 'รายการสินทรัพย์',
    vietnamese: 'Danh mục tài sản'
  },
  {
    code: 'asset-expenses',
    english: 'Asset Purchases & Expenses',
    khmer: 'ការទិញ និងចំណាយលើទ្រព្យសកម្ម',
    chinese: '资产采购与费用',
    thai: 'จัดซื้อและค่าใช้จ่ายสินทรัพย์',
    vietnamese: 'Mua sắm & Chi phí tài sản'
  },
  {
    code: 'asset-depreciation',
    english: 'Depreciation Schedule',
    khmer: 'កាលវិភាគរំលស់ទ្រព្យសកម្ម',
    chinese: '折旧计提计划',
    thai: 'ตารางค่าเสื่อมราคา',
    vietnamese: 'Lịch khấu hao tài sản'
  },
  {
    code: 'asset-evaluation',
    english: 'Asset Evaluation',
    khmer: 'ការវាយតម្លៃទ្រព្យសកម្មឡើងវិញ',
    chinese: '资产重估价值',
    thai: 'การประเมินมูลค่าสินทรัพย์',
    vietnamese: 'Định giá lại tài sản'
  },
  {
    code: 'asset-stock-using',
    english: 'Asset Stock Using',
    khmer: 'ការប្រើប្រាស់សម្ភារទ្រព្យសកម្ម',
    chinese: '资产备件领用',
    thai: 'การเบิกใช้วัสดุสินทรัพย์',
    vietnamese: 'Sử dụng phụ tùng tài sản'
  },
  {
    code: 'leasing-assets',
    english: 'List Fleet Assets',
    khmer: 'បញ្ជីយានយន្ត និងទ្រព្យជួល',
    chinese: '租赁车队资产',
    thai: 'รายการยานพาหนะให้เช่า',
    vietnamese: 'Tài sản cho thuê'
  },
  {
    code: 'leases-list',
    english: 'Lease Contracts',
    khmer: 'កិច្ចសន្យាជួលទិញ',
    chinese: '租赁合同',
    thai: 'สัญญาเช่าซื้อ',
    vietnamese: 'Hợp đồng cho thuê'
  },
  {
    code: 'leasing-invoices',
    english: 'Generate Invoices',
    khmer: 'ចេញវិក្កយបត្រជួលទិញ',
    chinese: '生成租赁账单',
    thai: 'สร้างใบแจ้งหนี้ค่าเช่า',
    vietnamese: 'Tạo hóa đơn tiền thuê'
  },
  {
    code: 'leasing-blacklists',
    english: 'Blacklist Governance',
    khmer: 'បញ្ជីខ្មៅអតិថិជនជួលទិញ',
    chinese: '黑名单管理',
    thai: 'บัญชีดำลูกค้า',
    vietnamese: 'Danh sách đen (Blacklist)'
  },
  {
    code: 'leasing-end',
    english: 'End Leasing',
    khmer: 'បញ្ចប់កិច្ចសន្យាជួលទិញ',
    chinese: '终止租赁',
    thai: 'สิ้นสุดสัญญาเช่า',
    vietnamese: 'Thanh lý hợp đồng'
  },

  // ==========================================
  // 7. CRM & LEADS SUBMENUS
  // ==========================================
  {
    code: 'leads-groups',
    english: 'Lead Groups',
    khmer: 'ក្រុមអតិថិជនសក្តានុពល',
    chinese: '线索分组',
    thai: 'กลุ่มลูกค้าเป้าหมาย',
    vietnamese: 'Nhóm khách hàng tiềm năng'
  },
  {
    code: 'leads-list',
    english: 'Leads',
    khmer: 'អតិថិជនសក្តានុពល (Leads)',
    chinese: '意向客户线索',
    thai: 'รายชื่อลูกค้าเป้าหมาย',
    vietnamese: 'Đầu mối tiềm năng (Leads)'
  },
  {
    code: 'leads-pipeline',
    english: 'Sales Pipeline',
    khmer: 'ដំណាក់កាលលក់ (Pipeline)',
    chinese: '商机漏斗',
    thai: 'กระบวนการติดตามการขาย',
    vietnamese: 'Kênh bán hàng (Pipeline)'
  },

  // ==========================================
  // 8. REAL ESTATE & PROPERTIES SUBMENUS
  // ==========================================
  {
    code: 'property-sales',
    english: 'List Property Sales',
    khmer: 'បញ្ជីការលក់អចលនទ្រព្យ',
    chinese: '房产销售记录',
    thai: 'รายการขายอสังหาฯ',
    vietnamese: 'Danh sách bán bất động sản'
  },
  {
    code: 'property-add-sale',
    english: 'Add Property Sale',
    khmer: 'បង្កើតការលក់អចលនទ្រព្យថ្មី',
    chinese: '新建房产签约',
    thai: 'สร้างการขายอสังหาฯ ใหม่',
    vietnamese: 'Thêm giao dịch bất động sản'
  },
  {
    code: 'property-blocks',
    english: 'Blocks & Phases',
    khmer: 'ប្លុក និងតំបន់អភិវឌ្ឍន៍',
    chinese: '地块楼栋',
    thai: 'บล็อกและแปลงที่ดิน',
    vietnamese: 'Phân khu & Tòa nhà'
  },
  {
    code: 'property-list',
    english: 'List Property',
    khmer: 'បញ្ជីផ្ទះ និងដីឡូត៍',
    chinese: '房源房产名录',
    thai: 'รายการอสังหาริมทรัพย์',
    vietnamese: 'Danh mục bất động sản'
  },
  {
    code: 'property-add',
    english: 'Add Property',
    khmer: 'បន្ថែមអចលនទ្រព្យថ្មី',
    chinese: '添加新房源',
    thai: 'เพิ่มอสังหาริมทรัพย์',
    vietnamese: 'Thêm bất động sản'
  },
  {
    code: 'property-types',
    english: 'Property Type',
    khmer: 'ប្រភេទអចលនទ្រព្យ (វីឡា, ផ្ទះអាជីវកម្ម)',
    chinese: '房产户型类别',
    thai: 'ประเภทอสังหาริมทรัพย์',
    vietnamese: 'Loại hình bất động sản'
  },
  {
    code: 'property-units',
    english: 'Units & Plots',
    khmer: 'យូនីតផ្ទះ និងឡូត៍ដី',
    chinese: '房号单元',
    thai: 'ยูนิตและแปลงที่ดิน',
    vietnamese: 'Căn hộ & Lô đất'
  },

  // ==========================================
  // 9. COMMISSIONS SUBMENUS
  // ==========================================
  {
    code: 'commissions-payable',
    english: 'Commissions Payable',
    khmer: 'កម្រៃជើងសារត្រូវបើកផ្តល់',
    chinese: '应付佣金明细',
    thai: 'ค่านายหน้าที่ต้องจ่าย',
    vietnamese: 'Hoa hồng phải trả'
  },
  {
    code: 'commission-agents',
    english: 'Commission Agents',
    khmer: 'ភ្នាក់ងារទទួលកម្រៃជើងសារ',
    chinese: '代理经纪人',
    thai: 'ตัวแทนนายหน้า',
    vietnamese: 'Đại lý môi giới'
  },
  {
    code: 'commission-rates',
    english: 'Commission Rates',
    khmer: 'អត្រាកម្រៃជើងសារ',
    chinese: '佣金费率方案',
    thai: 'อัตราค่านายหน้า',
    vietnamese: 'Tỷ lệ hoa hồng'
  },

  // ==========================================
  // 10. MICROFINANCE / LOANS / SAVINGS / PAWNS
  // ==========================================
  {
    code: 'loan-applications',
    english: 'Loan Applications',
    khmer: 'ពាក្យស្នើសុំប្រាក់កម្ចី',
    chinese: '贷款申请审批',
    thai: 'ใบสมัครขอสินเชื่อ',
    vietnamese: 'Hồ sơ xin vay vốn'
  },
  {
    code: 'loans-list',
    english: 'List Loans',
    khmer: 'បញ្ជីកិច្ចសន្យាប្រាក់កម្ចី',
    chinese: '贷款合同台账',
    thai: 'รายการสัญญาเงินกู้',
    vietnamese: 'Danh sách khoản vay'
  },
  {
    code: 'loan-borrowers',
    english: 'Borrowers',
    khmer: 'អ្នកខ្ចីប្រាក់',
    chinese: '借款人名册',
    thai: 'รายชื่อผู้กู้ยืม',
    vietnamese: 'Khách hàng vay vốn'
  },
  {
    code: 'loan-charges',
    english: 'Loan Charges & Fees',
    khmer: 'កម្រៃសេវាកម្មប្រាក់កម្ចី',
    chinese: '贷款服务杂费',
    thai: 'ค่าธรรมเนียมเงินกู้',
    vietnamese: 'Phí dịch vụ khoản vay'
  },
  {
    code: 'loan-calculator',
    english: 'Loan Calculator',
    khmer: 'គណនាប្រាក់កម្ចី និងការប្រាក់',
    chinese: '利息还款试算器',
    thai: 'โปรแกรมคำนวณเงินกู้',
    vietnamese: 'Bảng tính lãi & gốc vay'
  },
  {
    code: 'pawns-list',
    english: 'Pawn List',
    khmer: 'បញ្ជីកិច្ចសន្យាបញ្ចាំ',
    chinese: '典当业务清单',
    thai: 'รายการจำนำ',
    vietnamese: 'Danh sách cầm đồ'
  },
  {
    code: 'savings-accounts',
    english: 'Saving Accounts',
    khmer: 'គណនីប្រាក់បញ្ញើសន្សំ',
    chinese: '储蓄账户一览',
    thai: 'บัญชีเงินฝากออมทรัพย์',
    vietnamese: 'Tài khoản tiết kiệm'
  },
  {
    code: 'savings-deposits',
    english: 'Deposits',
    khmer: 'ប្រតិបត្តិការដាក់ប្រាក់',
    chinese: '存款办理',
    thai: 'การฝากเงิน',
    vietnamese: 'Gửi tiền vào tài khoản'
  },
  {
    code: 'savings-withdrawals',
    english: 'Withdrawals',
    khmer: 'ប្រតិបត្តិការដកប្រាក់',
    chinese: '取款办理',
    thai: 'การถอนเงิน',
    vietnamese: 'Rút tiền'
  },
  {
    code: 'savings-rates',
    english: 'Interest Rates',
    khmer: 'អត្រាការប្រាក់ប្រចាំឆ្នាំ',
    chinese: '储蓄利率设定',
    thai: 'อัตราดอกเบี้ยเงินฝาก',
    vietnamese: 'Lãi suất tiền gửi'
  },
  {
    code: 'installments-list',
    english: 'List Installments',
    khmer: 'បញ្ជីកិច្ចសន្យាបង់រំលស់',
    chinese: '分期业务列表',
    thai: 'รายการสัญญาผ่อนชำระ',
    vietnamese: 'Danh sách trả góp'
  },
  {
    code: 'installments-customers',
    english: 'Installment Customers',
    khmer: 'អតិថិជនបង់រំលស់',
    chinese: '分期购车客户',
    thai: 'ลูกค้าผ่อนชำระ',
    vietnamese: 'Khách hàng mua trả góp'
  },
  {
    code: 'installments-schedules',
    english: 'Repayment Schedules',
    khmer: 'កាលវិភាគសងប្រាក់បង់រំលស់',
    chinese: '分期还款计划表',
    thai: 'ตารางการผ่อนชำระ',
    vietnamese: 'Lịch trả nợ định kỳ'
  },

  // ==========================================
  // 11. ROOMS & HOSPITALITY SUBMENUS
  // ==========================================
  {
    code: 'rooms-matrix',
    english: 'Room Status Matrix',
    khmer: 'តារាងស្ថានភាពបន្ទប់ (Room Matrix)',
    chinese: '客房房态大盘',
    thai: 'สถานะห้องพัก (Matrix)',
    vietnamese: 'Sơ đồ trạng thái phòng'
  },
  {
    code: 'rooms-reservations',
    english: 'Reservations',
    khmer: 'ការកក់បន្ទប់ទុកមុន',
    chinese: '客房预订管理',
    thai: 'การจองห้องพัก',
    vietnamese: 'Đặt phòng trước'
  },
  {
    code: 'rooms-checkin',
    english: 'Check In',
    khmer: 'ភ្ញៀវចូលស្នាក់នៅ (Check In)',
    chinese: '办理入住登记',
    thai: 'เช็คอินเข้าพัก',
    vietnamese: 'Làm thủ tục nhận phòng (Check-in)'
  },
  {
    code: 'rooms-checkout',
    english: 'Check Out',
    khmer: 'ភ្ញៀវចេញពីបន្ទប់ (Check Out)',
    chinese: '退房结账结算',
    thai: 'เช็คเอาท์',
    vietnamese: 'Làm thủ tục trả phòng (Check-out)'
  },
  {
    code: 'room-types',
    english: 'Room Types',
    khmer: 'ប្រភេទបន្ទប់សណ្ឋាគារ',
    chinese: '客房房型配置',
    thai: 'ประเภทห้องพัก',
    vietnamese: 'Loại phòng khách sạn'
  },

  // ==========================================
  // 12. TICKETS & TRAVEL SUBMENUS
  // ==========================================
  {
    code: 'tickets-list',
    english: 'List Tickets',
    khmer: 'បញ្ជីសំបុត្ររថយន្ត និងទូក',
    chinese: '客运车票列表',
    thai: 'รายการตั๋วโดยสาร',
    vietnamese: 'Danh sách vé xe'
  },
  {
    code: 'tickets-booking',
    english: 'Book Ticket',
    khmer: 'កក់សំបុត្រថ្មី',
    chinese: '在线售票预订',
    thai: 'จองตั๋วเดินทาง',
    vietnamese: 'Đặt vé mới'
  },
  {
    code: 'tickets-routes',
    english: 'Routes & Destinations',
    khmer: 'ខ្សែរត់ និងទិសដៅធ្វើដំណើរ',
    chinese: '班次客运线路',
    thai: 'เส้นทางและจุดหมายปลายทาง',
    vietnamese: 'Tuyến đường & Điểm đến'
  },
  {
    code: 'tickets-schedules',
    english: 'Trip Schedules',
    khmer: 'កាលវិភាគចេញដំណើរ',
    chinese: '发车时刻表',
    thai: 'ตารางเวลาเดินรถ',
    vietnamese: 'Lịch trình xuất bến'
  },
  {
    code: 'bus-stations',
    english: 'Stations & Terminals',
    khmer: 'ស្ថានីយ៍ និងចំណតរថយន្ត',
    chinese: '客运车站站点',
    thai: 'สถานีและจุดจอดรถ',
    vietnamese: 'Bến xe & Trạm trung chuyển'
  },

  // ==========================================
  // 13. CONCRETE & TRUCKING & CLEARANCES
  // ==========================================
  {
    code: 'concretes-sales',
    english: 'Concrete Sales',
    khmer: 'ការលក់បេតុង',
    chinese: '商品混凝土销售',
    thai: 'การขายคอนกรีต',
    vietnamese: 'Bán bê tông thương phẩm'
  },
  {
    code: 'concretes-deliveries',
    english: 'Delivery Schedule',
    khmer: 'កាលវិភាគដឹកជញ្ជូនបេតុង',
    chinese: '混凝土发料调度',
    thai: 'กำหนดการจัดส่งคอนกรีต',
    vietnamese: 'Lịch đổ bê tông'
  },
  {
    code: 'concrete-trucks',
    english: 'Mixer Trucks',
    khmer: 'ឡានលាយបេតុង',
    chinese: '水泥搅拌车队',
    thai: 'รถโม่ปูน',
    vietnamese: 'Xe bồn trộn bê tông'
  },
  {
    code: 'concrete-drivers',
    english: 'Concrete Drivers',
    khmer: 'អ្នកបើកបរឡានបេតុង',
    chinese: '搅拌车驾驶员',
    thai: 'พนักงานขับรถโม่ปูน',
    vietnamese: 'Tài xế xe bê tông'
  },
  {
    code: 'concrete-plants',
    english: 'Batching Plants',
    khmer: 'រោងចក្រផលិតបេតុង',
    chinese: '水泥搅拌站厂',
    thai: 'โรงงานผลิตคอนกรีตผสมเสร็จ',
    vietnamese: 'Trạm trộn bê tông'
  },
  {
    code: 'truckings-orders',
    english: 'Trucking Orders',
    khmer: 'ការបញ្ជាដឹកជញ្ជូនទំនិញ',
    chinese: '货运托运订单',
    thai: 'ใบสั่งขนส่งสินค้า',
    vietnamese: 'Đơn hàng vận tải'
  },
  {
    code: 'trucking-fleet',
    english: 'Truck Fleet',
    khmer: 'កងរថយន្តកុងតឺន័រ និងរថយន្តធំ',
    chinese: '货运卡车车队',
    thai: 'กองรถบรรทุก',
    vietnamese: 'Đội xe tải đầu kéo'
  },
  {
    code: 'trucking-drivers',
    english: 'Truck Drivers',
    khmer: 'អ្នកបើកបររថយន្តដឹកទំនិញ',
    chinese: '货车司机档案',
    thai: 'พนักงานขับรถบรรทุก',
    vietnamese: 'Tài xế xe tải'
  },
  {
    code: 'shipping-rates',
    english: 'Freight Rates',
    khmer: 'តម្លៃសេវាដឹកជញ្ជូន',
    chinese: '运价运费标准',
    thai: 'อัตราค่าระวางขนส่ง',
    vietnamese: 'Cước phí vận chuyển'
  },
  {
    code: 'clearance-orders',
    english: 'Clearance Orders',
    khmer: 'បញ្ជីឯកសារបោសសម្អាតគយ',
    chinese: '进出口报关单',
    thai: 'ใบสั่งงานพิธีการศุลกากร',
    vietnamese: 'Hồ sơ thông quan'
  },
  {
    code: 'clearance-documents',
    english: 'Customs Documents',
    khmer: 'ឯកសារភ្ជាប់ប្រកាសគយ',
    chinese: '单证文件档案',
    thai: 'เอกสารศุลกากร',
    vietnamese: 'Chứng từ xuất nhập khẩu'
  },
  {
    code: 'customs-declarations',
    english: 'Declarations',
    khmer: 'លិខិតប្រកាសគយ (CD)',
    chinese: '海关申报明细',
    thai: 'ใบขนสินค้าขาเข้า-ออก',
    vietnamese: 'Tờ khai hải quan'
  },
  {
    code: 'clearance-ports',
    english: 'Ports & Border Gates',
    khmer: 'កំពង់ផែ និងច្រកទ្វារព្រំដែន',
    chinese: '口岸码头口岸',
    thai: 'ท่าเรือและด่านพรมแดน',
    vietnamese: 'Cửa khẩu & Cảng biển'
  },

  // ==========================================
  // 14. GYM & FITNESS SUBMENUS
  // ==========================================
  {
    code: 'gym-members',
    english: 'Gym Members',
    khmer: 'សមាជិកក្លឹបហាត់ប្រាណ',
    chinese: '健身会员名册',
    thai: 'สมาชิกฟิตเนส',
    vietnamese: 'Hội viên phòng tập'
  },
  {
    code: 'gym-packages',
    english: 'Membership Packages',
    khmer: 'កញ្ចប់សមាជិកភាព',
    chinese: '健身会员卡套餐',
    thai: 'แพ็กเกจสมาชิก',
    vietnamese: 'Gói tập thể hình'
  },
  {
    code: 'gym-checkin',
    english: 'Turnstile Check-In',
    khmer: 'ស្កេនចូលហាត់ប្រាណ (Check-in)',
    chinese: '闸机刷卡入场',
    thai: 'สแกนเข้าประตูยิม',
    vietnamese: 'Điểm danh vào cửa (Turnstile)'
  },
  {
    code: 'gym-classes',
    english: 'Fitness Classes',
    khmer: 'ថ្នាក់បង្រៀនហាត់ប្រាណ',
    chinese: '团操私教课程',
    thai: 'คลาสออกกำลังกาย',
    vietnamese: 'Lớp học thể hình'
  },
  {
    code: 'gym-trainers',
    english: 'Trainers & Coaches',
    khmer: 'គ្រូបង្វឹកហាត់ប្រាណ',
    chinese: '健身教练名录',
    thai: 'เทรนเนอร์ฟิตเนส',
    vietnamese: 'Huấn luyện viên (PT)'
  },

  // ==========================================
  // 15. SCHOOLS & EDUCATION SUBMENUS
  // ==========================================
  {
    code: 'students-list',
    english: 'Students',
    khmer: 'បញ្ជីសិស្ស និងនិស្សិត',
    chinese: '学籍档案列表',
    thai: 'รายชื่อนักเรียนนักศึกษา',
    vietnamese: 'Danh sách học sinh sinh viên'
  },
  {
    code: 'student-admissions',
    english: 'Admissions',
    khmer: 'ការចុះឈ្មោះចូលរៀន',
    chinese: '招生录取办理',
    thai: 'การรับสมัครเข้าเรียน',
    vietnamese: 'Tuyển sinh & Nhập học'
  },
  {
    code: 'schools-colleges',
    english: 'Colleges & Faculties',
    khmer: 'មហាវិទ្យាល័យ និងដេប៉ាតឺម៉ង់',
    chinese: '院系设置',
    thai: 'คณะและวิทยาลัย',
    vietnamese: 'Khoa & Trường thành viên'
  },
  {
    code: 'schools-programs',
    english: 'Academic Programs',
    khmer: 'កម្មវិធីសិក្សាអប់រំ',
    chinese: '专业培养方案',
    thai: 'หลักสูตรการศึกษา',
    vietnamese: 'Chương trình đào tạo'
  },
  {
    code: 'schools-classes',
    english: 'Classes & Sections',
    khmer: 'ថ្នាក់រៀន និងបន្ទប់សិក្សា',
    chinese: '行政班级设置',
    thai: 'ชั้นเรียนและห้องเรียน',
    vietnamese: 'Lớp học & Phòng học'
  },
  {
    code: 'schools-timetable',
    english: 'Timetable',
    khmer: 'កាលវិភាគបង្រៀន និងរៀន',
    chinese: '课程排课总表',
    thai: 'ตารางเรียนตารางสอน',
    vietnamese: 'Thời khóa biểu'
  },
  {
    code: 'schools-examinations',
    english: 'Examinations',
    khmer: 'ការប្រឡង និងលទ្ធផល',
    chinese: '期中期末考务',
    thai: 'การสอบและประเมินผล',
    vietnamese: 'Kỳ thi & Điểm số'
  },
  {
    code: 'schools-attendances',
    english: 'Student Attendance',
    khmer: 'វត្តមានសិស្សប្រចាំថ្ងៃ',
    chinese: '学生日常考勤',
    thai: 'การเช็คชื่อนักเรียน',
    vietnamese: 'Điểm danh học sinh'
  },
  {
    code: 'fees-collection',
    english: 'Fees Collection',
    khmer: 'ការប្រមូលថ្លៃសិក្សា',
    chinese: '学杂费缴费收取',
    thai: 'การเก็บค่าเล่าเรียน',
    vietnamese: 'Thu học phí'
  },
  {
    code: 'schools-library',
    english: 'Library',
    khmer: 'បណ្ណាល័យសាលា',
    chinese: '图书借阅馆藏',
    thai: 'ห้องสมุด',
    vietnamese: 'Thư viện trường'
  },
  {
    code: 'schools-transport',
    english: 'School Transport',
    khmer: 'រថយន្តដឹកសិស្ស',
    chinese: '校车线路接送',
    thai: 'รถรับส่งนักเรียน',
    vietnamese: 'Xe đưa đón học sinh'
  },

  // ==========================================
  // 16. PROJECTS & CONSTRUCTION SUBMENUS
  // ==========================================
  {
    code: 'projects-list',
    english: 'Projects',
    khmer: 'បញ្ជីគម្រោងសាងសង់',
    chinese: '工程项目台账',
    thai: 'รายการโครงการ',
    vietnamese: 'Danh sách dự án'
  },
  {
    code: 'project-tasks',
    english: 'Project Tasks',
    khmer: 'កិច្ចការងារក្នុងគម្រោង',
    chinese: '任务分解执行',
    thai: 'งานและกิจกรรมโครงการ',
    vietnamese: 'Công việc dự án'
  },
  {
    code: 'project-milestones',
    english: 'Milestones',
    khmer: 'ដំណាក់កាលសម្រេចសំខាន់ (Milestones)',
    chinese: '关键里程碑',
    thai: 'หมุดหมายสำคัญ (Milestones)',
    vietnamese: 'Cột mốc dự án (Milestones)'
  },
  {
    code: 'project-timesheets',
    english: 'Timesheets',
    khmer: 'តារាងម៉ោងធ្វើការតាមគម្រោង',
    chinese: '工时工日填报',
    thai: 'ตารางบันทึกเวลาทำงาน',
    vietnamese: 'Bảng chấm công dự án'
  },

  // ==========================================
  // 17. MANUFACTURING & WORK ORDERS
  // ==========================================
  {
    code: 'workorders-list',
    english: 'Work Orders',
    khmer: 'បញ្ជីបញ្ជាការងារផលិតកម្ម',
    chinese: '车间制造工单',
    thai: 'ใบสั่งผลิต',
    vietnamese: 'Lệnh sản xuất'
  },
  {
    code: 'bom-list',
    english: 'Bill of Materials (BOM)',
    khmer: 'រូបមន្តផ្សំផលិតផល (BOM)',
    chinese: '产品配方物料清单(BOM)',
    thai: 'สูตรการผลิต (BOM)',
    vietnamese: 'Định mức nguyên vật liệu (BOM)'
  },
  {
    code: 'production-status',
    english: 'Production Status',
    khmer: 'ស្ថានភាពផលិតកម្មរោងចក្រ',
    chinese: '产线加工进度',
    thai: 'สถานะการผลิต',
    vietnamese: 'Tiến độ sản xuất'
  },

  // ==========================================
  // 18. MONEY EXCHANGE SUBMENUS
  // ==========================================
  {
    code: 'money-change-counter',
    english: 'Exchange Counter',
    khmer: 'បញ្ជរប្តូរប្រាក់ផ្ទាល់',
    chinese: '货币兑换柜台',
    thai: 'เคาน์เตอร์แลกเงิน',
    vietnamese: 'Quầy đổi ngoại tệ'
  },
  {
    code: 'exchange-transactions',
    english: 'Transactions',
    khmer: 'ប្រតិបត្តិការទិញលក់រូបិយប័ណ្ណ',
    chinese: '兑换流水明细',
    thai: 'ธุรกรรมแลกเปลี่ยนเงิน',
    vietnamese: 'Giao dịch đổi tiền'
  },
  {
    code: 'exchange-rates',
    english: 'Currency Rates',
    khmer: 'តារាងអត្រាប្តូរប្រាក់ប្រចាំថ្ងៃ',
    chinese: '实时外汇牌价',
    thai: 'อัตราแลกเปลี่ยนเงินตรา',
    vietnamese: 'Tỷ giá ngoại tệ hôm nay'
  },
  {
    code: 'forex-vault',
    english: 'Forex Vault',
    khmer: 'តុដេកសាច់ប្រាក់រូបិយប័ណ្ណ',
    chinese: '外汇资金总金库',
    thai: 'ห้องนิรภัยเงินตราต่างประเทศ',
    vietnamese: 'Kho tiền ngoại tệ'
  },

  // ==========================================
  // 19. ACCOUNTING & GENERAL LEDGER
  // ==========================================
  {
    code: 'chart-of-accounts',
    english: 'Chart of Accounts',
    khmer: 'តារាងគណនីគណនេយ្យ (COA)',
    chinese: '会计科目表(COA)',
    thai: 'ผังบัญชี (COA)',
    vietnamese: 'Hệ thống tài khoản kế toán (COA)'
  },
  {
    code: 'journal-entries',
    english: 'Journal Entries',
    khmer: 'កំណត់ត្រាទិនានុប្បវត្តិគណនេយ្យ',
    chinese: '记账凭证录入',
    thai: 'รายการสมุดรายวันทั่วไป',
    vietnamese: 'Bút toán sổ nhật ký'
  },
  {
    code: 'ar-ap-aging',
    english: 'AR / AP Aging',
    khmer: 'របាយការណ៍អាយុកាលបំណុល (AR/AP)',
    chinese: '应收应付账龄分析',
    thai: 'รายงานอายุหนี้ (AR/AP)',
    vietnamese: 'Tuổi nợ phải thu / phải trả'
  },
  {
    code: 'tax-declarations',
    english: 'Tax Declarations',
    khmer: 'លិខិតប្រកាសពន្ធប្រចាំខែ',
    chinese: '月度申报报表',
    thai: 'การยื่นแบบภาษีประจำเดือน',
    vietnamese: 'Tờ khai thuế tháng/quý'
  },
  {
    code: 'vat-sales',
    english: 'VAT on Sales',
    khmer: 'អាករលើតម្លៃបន្ថែមពីលើការលក់ (Output VAT)',
    chinese: '销项增值税',
    thai: 'ภาษีขาย (Output VAT)',
    vietnamese: 'Thuế GTGT đầu ra'
  },
  {
    code: 'vat-purchases',
    english: 'VAT on Purchases',
    khmer: 'អាករលើតម្លៃបន្ថែមពីលើការទិញ (Input VAT)',
    chinese: '进项增值税',
    thai: 'ภาษีซื้อ (Input VAT)',
    vietnamese: 'Thuế GTGT đầu vào'
  },

  // ==========================================
  // 20. HR & ATTENDANCE & PAYROLL SUBMENUS
  // ==========================================
  {
    code: 'job-openings',
    english: 'Job Openings',
    khmer: 'សេចក្តីប្រកាសជ្រើសរើសបុគ្គលិក',
    chinese: '招聘岗位发布',
    thai: 'ตำแหน่งงานว่าง',
    vietnamese: 'Tuyển dụng nhân sự'
  },
  {
    code: 'candidates',
    english: 'Candidates',
    khmer: 'បេក្ខជនដាក់ពាក្យ',
    chinese: '应聘候选人',
    thai: 'ผู้สมัครงาน',
    vietnamese: 'Ứng viên dự tuyển'
  },
  {
    code: 'employees',
    english: 'Employees',
    khmer: 'បញ្ជីបុគ្គលិកទាំងអស់',
    chinese: '员工全员名录',
    thai: 'พนักงานทั้งหมด',
    vietnamese: 'Danh sách nhân viên'
  },
  {
    code: 'org-chart',
    english: 'Org Chart',
    khmer: 'រចនាសម្ព័ន្ធស្ថាប័ន (Org Chart)',
    chinese: '组织架构图',
    thai: 'แผนผังองค์กร',
    vietnamese: 'Sơ đồ tổ chức công ty'
  },
  {
    code: 'awards-warnings',
    english: 'Awards & Warnings',
    khmer: 'ការលើកទឹកចិត្ត និងការព្រមាន',
    chinese: '员工奖惩记录',
    thai: 'การให้รางวัลและการตักเตือน',
    vietnamese: 'Khen thưởng & Kỷ luật'
  },
  {
    code: 'resignations',
    english: 'Resignations',
    khmer: 'ការលាលែងពីការងារ',
    chinese: '离职交接手续',
    thai: 'การลาออกของพนักงาน',
    vietnamese: 'Thủ tục thôi việc'
  },
  {
    code: 'staff-training',
    english: 'Training',
    khmer: 'ការបណ្តុះបណ្តាលបុគ្គលិក',
    chinese: '内部员工培训',
    thai: 'การฝึกอบรมพนักงาน',
    vietnamese: 'Đào tạo nhân sự'
  },
  {
    code: 'attendance-list',
    english: 'Attendances',
    khmer: 'វត្តមានបុគ្គលិក',
    chinese: '每日出勤记录',
    thai: 'บันทึกเวลาทำงาน',
    vietnamese: 'Bảng chấm công hàng ngày'
  },
  {
    code: 'check-in-out',
    english: 'Check In / Out',
    khmer: 'ស្កេនចូល / ចេញធ្វើការ',
    chinese: '考勤打卡登记',
    thai: 'ลงเวลาเข้า-ออกงาน',
    vietnamese: 'Chấm công vào / ra'
  },
  {
    code: 'day-off',
    english: 'Day Off & Holidays',
    khmer: 'ថ្ងៃឈប់សម្រាក និងបុណ្យជាតិ',
    chinese: '节假日公休设定',
    thai: 'วันหยุดประจำสัปดาห์และวันหยุดนักขัตฤกษ์',
    vietnamese: 'Ngày nghỉ & Ngày lễ'
  },
  {
    code: 'attendance-devices',
    english: 'Biometric Devices',
    khmer: 'ម៉ាស៊ីនស្កេនក្រយៅដៃ និងមុខ',
    chinese: '指纹人脸考勤机',
    thai: 'เครื่องสแกนลายนิ้วมือและใบหน้า',
    vietnamese: 'Máy chấm công vân tay & khuôn mặt'
  },
  {
    code: 'employee-benefits',
    english: 'Benefits & Allowances',
    khmer: 'អត្ថប្រយោជន៍ និងប្រាក់ឧបត្ថម្ភ',
    chinese: '福利与补贴津贴',
    thai: 'สวัสดิการและเบี้ยเลี้ยง',
    vietnamese: 'Phúc lợi & Phụ cấp'
  },
  {
    code: 'pre-salaries',
    english: 'Pre-Salaries',
    khmer: 'ប្រាក់បើកមុន (Advance)',
    chinese: '薪资预支借款',
    thai: 'เบิกเงินเดือนล่วงหน้า',
    vietnamese: 'Ứng lương'
  },
  {
    code: 'salaries-list',
    english: 'Salaries',
    khmer: 'បញ្ជីបើកប្រាក់បៀវត្សរ៍',
    chinese: '工资台账发放',
    thai: 'รายการจ่ายเงินเดือน',
    vietnamese: 'Bảng thanh toán lương'
  },
  {
    code: 'thirteenth-salary',
    english: '13th Month Salary',
    khmer: 'ប្រាក់ខែទី១៣ (ប្រាក់លើកទឹកចិត្ត)',
    chinese: '第13薪年终奖金',
    thai: 'เงินเดือนเดือนที่ 13 (โบนัส)',
    vietnamese: 'Lương tháng 13'
  },
  {
    code: 'payroll-payments',
    english: 'Payroll Payments',
    khmer: 'ការផ្ទេរប្រាក់បៀវត្សរ៍',
    chinese: '工资支付过账',
    thai: 'การโอนจ่ายเงินเดือน',
    vietnamese: 'Chi trả lương ngân hàng'
  },
  {
    code: 'payslips',
    english: 'Payslips',
    khmer: 'ប័ណ្ណបើកប្រាក់ខែ (Payslip)',
    chinese: '员工个人工资条',
    thai: 'สลิปเงินเดือน',
    vietnamese: 'Phiếu lương (Payslip)'
  },

  // ==========================================
  // 21. CLINIC & HEALTHCARE SUBMENUS
  // ==========================================
  {
    code: 'consultation',
    english: 'Consultation',
    khmer: 'ការពិគ្រោះជំងឺទូទៅ',
    chinese: '门诊问诊',
    thai: 'การตรวจปรึกษาแพทย์',
    vietnamese: 'Khám & Tư vấn bệnh'
  },
  {
    code: 'opd',
    english: 'OPD (Outpatient)',
    khmer: 'អ្នកជំងឺក្រៅ (OPD)',
    chinese: '门诊部(OPD)',
    thai: 'ผู้ป่วยนอก (OPD)',
    vietnamese: 'Khám ngoại trú (OPD)'
  },
  {
    code: 'ipd-patient',
    english: 'IPD Patient (Inpatient)',
    khmer: 'អ្នកជំងឺសម្រាកព្យាបាល (IPD)',
    chinese: '住院患者(IPD)',
    thai: 'ผู้ป่วยใน (IPD)',
    vietnamese: 'Bệnh nhân nội trú (IPD)'
  },
  {
    code: 'progress-note',
    english: 'Progress Note',
    khmer: 'កំណត់ត្រាវឌ្ឍនភាពជំងឺ',
    chinese: '病程跟踪记录',
    thai: 'บันทึกความก้าวหน้าการรักษา',
    vietnamese: 'Ghi chú diễn tiến bệnh'
  },
  {
    code: 'medication-dose',
    english: 'Medication Dose',
    khmer: 'កម្រិតថ្នាំពេទ្យ',
    chinese: '给药用药剂量',
    thai: 'ขนาดยาและวิธีใช้',
    vietnamese: 'Liều lượng thuốc'
  },
  {
    code: 'pathology',
    english: 'Pathology & Lab',
    khmer: 'មន្ទីរពិសោធន៍វេជ្ជសាស្ត្រ',
    chinese: '病理与化验检验',
    thai: 'ห้องปฏิบัติการพยาธิวิทยา',
    vietnamese: 'Xét nghiệm y khoa'
  },
  {
    code: 'prescription',
    english: 'Prescription',
    khmer: 'វេជ្ជបញ្ជាថ្នាំ',
    chinese: '医生处方单',
    thai: 'ใบสั่งยา',
    vietnamese: 'Đơn thuốc'
  },
  {
    code: 'medicines',
    english: 'Medicines & Drugs',
    khmer: 'ឱសថ និងថ្នាំពេទ្យ',
    chinese: '药品库存名录',
    thai: 'เวชภัณฑ์และยารักษาโรค',
    vietnamese: 'Danh mục thuốc y tế'
  },
  {
    code: 'add-medicine',
    english: 'Add Medicine',
    khmer: 'បន្ថែមឱសថថ្មី',
    chinese: '录入新药品',
    thai: 'เพิ่มยาใหม่',
    vietnamese: 'Thêm thuốc mới'
  },
  {
    code: 'bed-list',
    english: 'Hospital Beds',
    khmer: 'បញ្ជីគ្រែសម្រាកព្យាបាល',
    chinese: '住院病床名录',
    thai: 'เตียงผู้ป่วย',
    vietnamese: 'Danh sách giường bệnh'
  },
  {
    code: 'bed-assign',
    english: 'Assign Bed',
    khmer: 'ចាត់ចែងគ្រែសម្រាកអ្នកជំងឺ',
    chinese: '分配安排病床',
    thai: 'จัดสรรเตียงผู้ป่วย',
    vietnamese: 'Phân bổ giường bệnh'
  },

  // ==========================================
  // 22. WEBSITE CMS & STOREFRONT SUBMENUS
  // ==========================================
  {
    code: 'shop-control',
    english: 'Stores Controller',
    khmer: 'គ្រប់គ្រងហាង និងសាខា E-Menu',
    chinese: '连锁门店控制',
    thai: 'จัดการสาขาร้านค้า',
    vietnamese: 'Quản lý chuỗi cửa hàng'
  },
  {
    code: 'store-products',
    english: 'Store Products',
    khmer: 'ទំនិញលក់លើគេហទំព័រ',
    chinese: '线上商城产品',
    thai: 'สินค้าในร้านค้าออนไลน์',
    vietnamese: 'Sản phẩm cửa hàng'
  },
  {
    code: 'website-display',
    english: 'Website Display',
    khmer: 'ការបង្ហាញលើគេហទំព័រ',
    chinese: '网站展示装修',
    thai: 'การแสดงผลหน้าเว็บไซต์',
    vietnamese: 'Hiển thị trang web'
  },
  {
    code: 'cms-dashboard',
    english: 'Admin Data Dashboard',
    khmer: 'ផ្ទាំងទិន្នន័យគេហទំព័រ',
    chinese: '数据大屏看板',
    thai: 'แดชบอร์ดข้อมูลเว็บไซต์',
    vietnamese: 'Bảng điều khiển dữ liệu CMS'
  },
  {
    code: 'cms-posts',
    english: 'Posts & Articles',
    khmer: 'អត្ថបទ និងព័ត៌មាន',
    chinese: '文章与资讯',
    thai: 'บทความและข่าวสาร',
    vietnamese: 'Bài viết & Tin tức'
  },
  {
    code: 'cms-stories',
    english: 'Visual Stories',
    khmer: 'រឿងរ៉ាវរូបភាព (Stories)',
    chinese: '多媒体故事',
    thai: 'สตอรี่ภาพเรื่องราว',
    vietnamese: 'Câu chuyện hình ảnh (Stories)'
  },
  {
    code: 'cms-media',
    english: 'Images & Media',
    khmer: 'បណ្ណាល័យរូបភាព និងមេឌៀ',
    chinese: '多媒体图库',
    thai: 'คลังรูปภาพและสื่อ',
    vietnamese: 'Kho hình ảnh & Đa phương tiện'
  },
  {
    code: 'cms-comments',
    english: 'Comments & Reviews',
    khmer: 'មតិយោបល់ និងការវាយតម្លៃ',
    chinese: '用户评论留言',
    thai: 'ความคิดเห็นและรีวิว',
    vietnamese: 'Bình luận & Đánh giá'
  },
  {
    code: 'cms-qrcode',
    english: 'QR Code Generator',
    khmer: 'បង្កើតកូដ QR សម្រាប់តុ និងហាង',
    chinese: '桌台点餐QR码生成',
    thai: 'เครื่องมือสร้างคิวอาร์โค้ด',
    vietnamese: 'Tạo mã QR bàn ăn'
  },
  {
    code: 'cms-settings',
    english: 'Website Settings',
    khmer: 'ការកំណត់គេហទំព័រ',
    chinese: '网站门户设置',
    thai: 'ตั้งค่าเว็บไซต์',
    vietnamese: 'Cấu hình website'
  },

  // ==========================================
  // 23. WEBSITE COMMON HEADERS, NAV & BUTTONS
  // ==========================================
  {
    code: 'home',
    english: 'Home',
    khmer: 'ទំព័រដើម',
    chinese: '首页',
    thai: 'หน้าแรก',
    vietnamese: 'Trang chủ'
  },
  {
    code: 'shops',
    english: 'Shops Directory',
    khmer: 'បញ្ជីហាងផ្គត់ផ្គង់',
    chinese: '商铺名录',
    thai: 'ไดเรกทอรีร้านค้า',
    vietnamese: 'Danh bạ cửa hàng'
  },
  {
    code: 'service',
    english: 'Services & Solutions',
    khmer: 'សេវាកម្ម និងដំណោះស្រាយ',
    chinese: '服务与解决方案',
    thai: 'บริการและโซลูชัน',
    vietnamese: 'Dịch vụ & Giải pháp'
  },
  {
    code: 'learn',
    english: 'Learning Academy',
    khmer: 'បណ្ឌិតសភាសិក្សា (Academy)',
    chinese: '学院培训',
    thai: 'ศูนย์การเรียนรู้',
    vietnamese: 'Học viện đào tạo'
  },
  {
    code: 'cart',
    english: 'Cart',
    khmer: 'កន្ត្រកទំនិញ',
    chinese: '购物车',
    thai: 'ตะกร้าสินค้า',
    vietnamese: 'Giỏ hàng'
  },
  {
    code: 'wishlist',
    english: 'Wishlist',
    khmer: 'ទំនិញពេញចិត្ត',
    chinese: '心愿单',
    thai: 'รายการโปรด',
    vietnamese: 'Sản phẩm yêu thích'
  },
  {
    code: 'operations_portal',
    english: 'Operations Portal',
    khmer: 'ប្រព័ន្ធគ្រប់គ្រង ERP',
    chinese: 'ERP管理门户',
    thai: 'พอร์ทัลจัดการ ERP',
    vietnamese: 'Cổng quản trị ERP'
  },
  {
    code: 'search_placeholder',
    english: 'Search wholesale products, stores, categories...',
    khmer: 'ស្វែងរកទំនិញបោះដុំ ហាង និងប្រភេទទំនិញ...',
    chinese: '搜索批发商品、门店或品类...',
    thai: 'ค้นหาสินค้าขายส่ง ร้านค้า หรือหมวดหมู่...',
    vietnamese: 'Tìm kiếm sản phẩm giá sỉ, cửa hàng, danh mục...'
  },
  {
    code: 'guest_workspace',
    english: 'Guest Workspace',
    khmer: 'គណនីភ្ញៀវ',
    chinese: '访客工作区',
    thai: 'พื้นที่สำหรับผู้เยี่ยมชม',
    vietnamese: 'Khu vực khách'
  },
  {
    code: 'public_catalog_mode',
    english: 'Public Catalog & Ordering Mode',
    khmer: 'របៀបកាតាឡុកសាធារណៈ និងការបញ្ជាទិញ',
    chinese: '公共选品采购模式',
    thai: 'โหมดสั่งซื้อและแคตตาล็อกสาธารณะ',
    vietnamese: 'Chế độ xem & đặt hàng công khai'
  },
  {
    code: 'sign_in_workspace',
    english: 'Sign In to Workspace',
    khmer: 'ចូលប្រើប្រាស់គណនី',
    chinese: '登录工作空间',
    thai: 'เข้าสู่ระบบ',
    vietnamese: 'Đăng nhập vào hệ thống'
  },
  {
    code: 'create_account',
    english: 'Create Account / Register',
    khmer: 'ចុះឈ្មោះបង្កើតគណនីថ្មី',
    chinese: '注册新账户',
    thai: 'สร้างบัญชี / ลงทะเบียน',
    vietnamese: 'Tạo tài khoản mới'
  },
  {
    code: 'order_now',
    english: 'Order Now',
    khmer: 'បញ្ជាទិញឥឡូវនេះ',
    chinese: '立即下单',
    thai: 'สั่งซื้อเลย',
    vietnamese: 'Đặt hàng ngay'
  },
  {
    code: 'add_to_cart',
    english: 'Add to Cart',
    khmer: 'បញ្ចូលកន្ត្រក',
    chinese: '加入购物车',
    thai: 'เพิ่มลงตะกร้า',
    vietnamese: 'Thêm vào giỏ'
  },
  {
    code: 'basket',
    english: 'Basket',
    khmer: 'កន្ត្រកទំនិញ',
    chinese: '购物篮',
    thai: 'ตะกร้า',
    vietnamese: 'Giỏ hàng'
  },
  {
    code: 'dine_in',
    english: 'Dine-In',
    khmer: 'ញ៉ាំនៅកន្លែង',
    chinese: '堂食',
    thai: 'ทานที่ร้าน',
    vietnamese: 'Dùng tại chỗ'
  },
  {
    code: 'take_away',
    english: 'Take-Away',
    khmer: 'ខ្ចប់ទៅផ្ទះ',
    chinese: '外带打包',
    thai: 'สั่งกลับบ้าน',
    vietnamese: 'Mang đi'
  },
  {
    code: 'table',
    english: 'Table',
    khmer: 'តុ',
    chinese: '桌号',
    thai: 'โต๊ะ',
    vietnamese: 'Bàn'
  },
  {
    code: 'switch_table',
    english: 'Switch Table',
    khmer: 'ប្តូរតុ',
    chinese: '换桌',
    thai: 'เปลี่ยนโต๊ะ',
    vietnamese: 'Đổi bàn'
  },
  {
    code: 'subtotal',
    english: 'Subtotal',
    khmer: 'សរុបរង',
    chinese: '小计',
    thai: 'ยอดรวมย่อย',
    vietnamese: 'Tạm tính'
  },
  {
    code: 'shipping',
    english: 'Shipping',
    khmer: 'សេវាដឹកជញ្ជូន',
    chinese: '物流配送',
    thai: 'ค่าจัดส่ง',
    vietnamese: 'Vận chuyển'
  },
  {
    code: 'free_shipping',
    english: 'Free Shipping',
    khmer: 'ដឹកជញ្ជូនឥតគិតថ្លៃ',
    chinese: '免费配送',
    thai: 'จัดส่งฟรี',
    vietnamese: 'Miễn phí vận chuyển'
  },
  {
    code: 'checkout',
    english: 'Checkout',
    khmer: 'ទូទាត់ប្រាក់',
    chinese: '去结账',
    thai: 'ชำระเงิน',
    vietnamese: 'Thanh toán'
  },
  {
    code: 'view_details',
    english: 'View Details',
    khmer: 'មើលព័ត៌មានលម្អិត',
    chinese: '查看详情',
    thai: 'ดูรายละเอียด',
    vietnamese: 'Xem chi tiết'
  },
  {
    code: 'all_rights_reserved',
    english: 'All rights reserved.',
    khmer: 'រក្សាសិទ្ធិគ្រប់យ៉ាង។',
    chinese: '版权所有。',
    thai: 'สงวนลิขสิทธิ์ทั้งหมด',
    vietnamese: 'Đã đăng ký bản quyền.'
  },

  // ==========================================
  // 24. ADMIN SIDEBAR SECTION GROUP TITLES
  // ==========================================
  {
    code: 'operations',
    english: 'Operations',
    khmer: 'ប្រតិបត្តិការអាជីវកម្ម',
    chinese: '核心业务',
    thai: 'การปฏิบัติการ',
    vietnamese: 'Vận hành cốt lõi'
  },
  {
    code: 'logistics_projects',
    english: 'Logistics & Projects',
    khmer: 'ភស្តុភារ និងគម្រោង',
    chinese: '物流与工程',
    thai: 'โลจิสติกส์และโครงการ',
    vietnamese: 'Hậu cần & Dự án'
  },
  {
    code: 'specialty_industry',
    english: 'Specialty & Industry',
    khmer: 'ឧស្សាហកម្មឯកទេស',
    chinese: '行业特色业务',
    thai: 'ธุรกิจเฉพาะทาง',
    vietnamese: 'Ngành nghề chuyên biệt'
  },
  {
    code: 'people_hr',
    english: 'People & HR',
    khmer: 'បុគ្គលិក និងធនធានមនុស្ស',
    chinese: '人员与人力',
    thai: 'บุคลากรและทรัพยากรบุคคล',
    vietnamese: 'Nhân sự & Con người'
  },
  {
    code: 'finance_banking',
    english: 'Finance & Banking',
    khmer: 'ហិរញ្ញវត្ថុ និងធនាគារ',
    chinese: '财务金融',
    thai: 'การเงินและการธนาคาร',
    vietnamese: 'Tài chính & Ngân hàng'
  },
  {
    code: 'administration_web',
    english: 'Administration & Web',
    khmer: 'រដ្ឋបាល និងគេហទំព័រ',
    chinese: '行政与网站',
    thai: 'การบริหารและเว็บไซต์',
    vietnamese: 'Hành chính & Trang web'
  },
  {
    code: 'pinned_favorites',
    english: 'Pinned Favorites',
    khmer: 'ម៉ូឌុលពេញនិយម',
    chinese: '常用收藏',
    thai: 'รายการโปรดที่ปักหมุด',
    vietnamese: 'Mục yêu thích ghim'
  },
  {
    code: 'search_modules',
    english: 'Search modules...',
    khmer: 'ស្វែងរកម៉ូឌុល...',
    chinese: '搜索业务模块...',
    thai: 'ค้นหาโมดูล...',
    vietnamese: 'Tìm kiếm mô-đun...'
  }
];

async function run() {
  console.log('Starting full translation insertion for Aura ERP & Website...');
  console.log(`Total dictionary entries to process: ${TRANSLATIONS_DATA.length}`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const item of TRANSLATIONS_DATA) {
    const code = item.code.trim();
    // We also generate the dash-case key if code has underscores or vice versa
    const variants = [code];
    if (code.includes('_')) {
      variants.push(code.replace(/_/g, '-'));
    } else if (code.includes('-')) {
      variants.push(code.replace(/-/g, '_'));
    }

    for (const vCode of variants) {
      try {
        const [res] = await db.query(
          `INSERT INTO aura_language (code, english, khmer, chinese, thai, vietnamese)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           english = VALUES(english),
           khmer = VALUES(khmer),
           chinese = VALUES(chinese),
           thai = VALUES(thai),
           vietnamese = VALUES(vietnamese)`,
          [vCode, item.english, item.khmer, item.chinese, item.thai, item.vietnamese]
        );
        if (res.affectedRows === 1) insertedCount++;
        else if (res.affectedRows === 2) updatedCount++;
      } catch (err) {
        console.error(`Failed to insert key ${vCode}:`, err.message);
      }
    }
  }

  const [totalRows] = await db.query('SELECT count(*) as total FROM aura_language');
  console.log('Finished inserting/updating translations.');
  console.log(`New entries inserted: ${insertedCount}`);
  console.log(`Existing entries updated: ${updatedCount}`);
  console.log(`Current total rows in aura_language: ${totalRows[0].total}`);

  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during translation sync:', err);
  process.exit(1);
});
