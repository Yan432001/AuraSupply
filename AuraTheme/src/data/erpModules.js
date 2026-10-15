const leaf = (key, label, description, options = {}) => ({
  key,
  label,
  description,
  playbook: options.playbook || [],
  route: options.route,
});

const group = (key, label, description, children, options = {}) => ({
  key,
  label,
  description,
  children,
  tone: options.tone || 'default',
});

export const erpModules = [
  {
    key: 'cms',
    label: 'Website CMS',
    iconKey: 'portal',
    accent: '#2563eb',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Live Website Modules',
    kpiValue: '13 Modules',
    description: 'Complete dynamic content management for public website pages, hero banners, menus, blog, and inquiries.',
    statusNote: 'Real-time database sync with English and Khmer bilingual support.',
    detailBullets: [
      'Manage Site Settings, Branding, Logos, Contact details, and Social Links.',
      'Configure Hero Slides, Navigation Menus, Custom Pages, and Blog Articles.',
      'Manage Team, Testimonials, FAQs, Partners, Media Assets, and Inquiries.',
      'Supports local MySQL (bpas_v6_8_9_db) with automatic table creation & migrations.',
    ],
    menus: [
      leaf('cms-dashboard', 'Admin Data Dashboard', 'Overview of total users, posts, stories, media, and recent activity.', { route: '/admins?module=data&section=dashboard' }),
      leaf('cms-users', 'Users & Roles', 'User accounts, permissions, and status.', { route: '/admins?module=data&section=users' }),
      leaf('cms-posts', 'Posts & Articles', 'Articles, brewing guides, and announcements.', { route: '/admins?module=data&section=posts' }),
      leaf('cms-stories', 'Visual Stories', 'Short videos and interactive visual stories.', { route: '/admins?module=data&section=stories' }),
      leaf('cms-media', 'Images & Media', 'Central asset gallery, dimensions, and file sizes.', { route: '/admins?module=data&section=media' }),
      leaf('cms-categories', 'Categories', 'Content groupings, tags, and taxonomies.', { route: '/admins?module=data&section=categories' }),
      leaf('cms-comments', 'Comments & Reviews', 'Reader comments and moderation status.', { route: '/admins?module=data&section=comments' }),
      leaf('cms-saved', 'Saved Items', 'User bookmarks, wishlists, and reading lists.', { route: '/admins?module=data&section=saved' }),
      leaf('cms-reports', 'Activity Reports', 'Website traffic, engagement, and audit logs.', { route: '/admins?module=data&section=reports' }),
      leaf('cms-qrcode', 'QR Code Generator', 'Generate and download printable table and counter QR codes for stores.', { route: '/admins?module=data&section=qrcode' }),
      leaf('cms-settings', 'Website Settings', 'Global branding, logo, contact, footer, and SEO configuration.', { route: '/admins?module=data&section=settings' }),
    ],
    submodules: [
      { key: 'cms-bilingual', label: 'Khmer Bilingual Support', enabled: true, description: 'Allows dual-language content editing.' },
      { key: 'cms-mysql', label: 'Local MySQL Sync', enabled: true, description: 'Synchronize directly to bpas_v6_8_9_db.' }
    ]
  },
  {
    key: 'clinic',
    label: 'Clinic',
    iconKey: 'clinic',
    accent: '#ef5b5b',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Patients Today',
    kpiValue: '184',
    description: 'Patient, consultation, OPD, IPD, pharmacy, and bed workflows.',
    statusNote: 'Clinical queue and pharmacy issue are synchronized.',
    detailBullets: [
      'Register patients and route them into consultation, OPD, and IPD.',
      'Manage notes, operations, pathology, and medication dose.',
      'Control beds, birth and death records, and clinic sales.',
    ],
    menus: [
      leaf('patients', 'List Patient', 'Review patient records and registration details.', {route: '/admins?module=clinic&menu=patients'}) ,
      leaf('consultation', 'Consultation', 'Manage doctor consultation and outcomes.'),
      leaf('opd', 'OPD', 'Track outpatient treatments and discharge-ready visits.'),
      group('clinic-ipd', 'IPD', 'Inpatient treatment and notes.', [
        leaf('ipd-patient', 'IPD Patient', 'See admitted patients and treatment status.'),
        leaf('progress-note', 'Progress Note', 'Maintain ongoing clinical observations.'),
        leaf('medication-dose', 'Medication Dose', 'Control medication schedules and changes.'),
        leaf('operations', 'Operations', 'Prepare and track procedure records.'),
        leaf('pathology', 'Pathology', 'Monitor pathology requests and results.'),
      ]),
      group('clinic-sales', 'Sales', 'Clinical prescriptions and billing.', [
        leaf('prescription', 'Prescription', 'Issue and review prescriptions.'),
        leaf('clinic-invoices', 'Invoice', 'Track clinic sales invoices and payment status.'),
      ]),
      group('clinic-pharmacy', 'Pharmacy', 'Medicine master data and issue flow.', [
        leaf('medicines', 'Medicines', 'Browse stocked medicines and availability.'),
        leaf('add-medicine', 'Add Medicine', 'Create a new medicine entry.'),
      ]),
      group('clinic-bed', 'Bed', 'Bed list and assignment.', [
        leaf('bed-list', 'Beds', 'Track bed occupancy and room readiness.'),
        leaf('bed-assign', 'Assign Bed', 'Assign or transfer inpatient beds.'),
      ]),
    ],
    submodules: [
      { key: 'ipd', label: 'IPD', enabled: true, description: 'Enable inpatient treatment workflows.' },
      { key: 'pharmacy-toggle', label: 'Pharmacy', enabled: true, description: 'Enable medicine stock and issue flows.' },
      { key: 'beds', label: 'Beds', enabled: true, description: 'Enable room and bed allocation features.' },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    iconKey: 'inventory',
    accent: '#0a84ff',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Tracked SKUs',
    kpiValue: '12.4K',
    description: 'Products, counts, transfers, receiving, and stock movement control.',
    statusNote: 'Cycle count variance remains below target.',
    detailBullets: [
      'Manage products, barcode labels, imports, and catalog structure.',
      'Run stock counts, adjustments, stock receiving, and transfers.',
      'Track reward exchange, stock using, and consignment flows.',
    ],
    menus: [
      group('inventory-catalog', 'Catalog', 'Core product master menus.', [
        leaf('products', 'List Products', 'Review the live catalog and stock list.'),
        leaf('add-product', 'Add Product', 'Create new products with pricing and stock defaults.'),
        leaf('import-products', 'Import Products', 'Bulk import products from templates.'),
        leaf('print-barcodes', 'Print Barcode Label', 'Prepare barcode and shelf labels.'),
      ]),
      group('inventory-stock-control', 'Stock Control', 'Counting, adjustments, and receiving.', [
        leaf('stock-counts', 'Stock Counts', 'Launch and reconcile count sessions.'),
        leaf('quantity-adjustments', 'Quantity Adjustments', 'Handle damaged or correction-based stock changes.'),
        leaf('stock-received', 'Stock Received', 'Track inbound receipts and completion.'),
        leaf('transfers', 'Transfers', 'Move stock between warehouses and branches.'),
      ]),
      group('inventory-extensions', 'Extensions', 'Operational and loyalty stock flows.', [
        leaf('stock-using', 'List Stock Using', 'Review internal stock consumption.'),
        leaf('customer-rewards', 'Customer Rewards Exchange', 'Manage customer point redemption.'),
        leaf('supplier-rewards', 'Supplier Rewards Exchange', 'Manage supplier reward exchanges.'),
        leaf('consignments', 'Consignments', 'Track consignment stock and balances.'),
      ]),
    ],
    submodules: [
      { key: 'multi-warehouse', label: 'Multi Warehouse', enabled: true, description: 'Split stock and counts across branch warehouses.' },
      { key: 'stock-using-toggle', label: 'Stock Using', enabled: true, description: 'Track internal stock consumption.' },
      { key: 'reward-exchange', label: 'Reward Exchange', enabled: true, description: 'Enable reward-related stock flows.' },
    ],
  },
  {
    key: 'asset',
    label: 'Assets',
    iconKey: 'asset',
    accent: '#4567ff',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Tracked Assets',
    kpiValue: '684',
    description: 'Fixed assets, depreciation, evaluations, and stock-using support.',
    statusNote: 'Depreciation schedules and evaluation dates are current.',
    detailBullets: [
      'Track asset master records, purchases, depreciation, and evaluations.',
      'Connect asset usage with internal stock consumption workflows.',
      'Provide a separate lane for asset expenses and supporting issues.',
    ],
    menus: [
      leaf('assets-list', 'List Assets', 'Browse all tracked assets and status history.'),
      leaf('assets-add', 'Add Assets', 'Register a new asset and assign ownership.'),
      leaf('asset-expenses', 'Asset Expenses', 'Review purchases and asset-linked expenses.'),
      leaf('asset-depreciation', 'Depreciation', 'Monitor scheduled depreciation and closing impact.'),
      leaf('asset-evaluation', 'Evaluation', 'Review valuation, inspection, and issue entries.'),
      leaf('asset-stock-using', 'List Stock Using', 'Track stock consumed for maintenance.'),
    ],
    submodules: [
      { key: 'asset-expense-toggle', label: 'Asset Expenses', enabled: true, description: 'Enable expense linkage for assets.' },
      { key: 'asset-evaluation-toggle', label: 'Evaluation', enabled: true, description: 'Enable periodic evaluation and inspection.' },
      { key: 'asset-stock-toggle', label: 'Stock Using', enabled: true, description: 'Enable maintenance stock issue control.' },
    ],
  },
  {
    key: 'procurement',
    label: 'Procurement',
    iconKey: 'procurement',
    accent: '#2f80ed',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Open POs',
    kpiValue: '186',
    description: 'Purchase requests, purchase orders, receiving, and supplier returns.',
    statusNote: 'Supplier confirmations are landing within SLA.',
    detailBullets: [
      'Capture internal demand and convert approved requests into POs.',
      'Track supplier receiving completion and invoice readiness.',
      'Handle purchase returns and AP preparation.',
    ],
    menus: [
      group('procurement-requesting', 'Requesting', 'Internal demand and approval.', [
        leaf('purchase-request-list', 'List Purchase Request', 'Review department demand before sourcing.'),
        leaf('purchase-request-add', 'Add Purchase Request', 'Open a new departmental request.'),
      ]),
      group('procurement-ordering', 'Ordering', 'Supplier ordering flow.', [
        leaf('purchase-order-list', 'List Purchase Order', 'Track issued POs and confirmations.'),
        leaf('purchase-order-add', 'Add Purchase Order', 'Create a supplier order from approved demand.'),
        leaf('purchases-list', 'List Purchases', 'Review purchase records after receipt or invoicing.'),
        leaf('purchase-by-excel', 'Purchase By Excel', 'Upload bulk purchase data from templates.'),
      ]),
      group('procurement-recovery', 'Returns & AP', 'Exception and payment preparation.', [
        leaf('ap-requested', 'AP Requested', 'Monitor purchases waiting for payable processing.'),
        leaf('purchase-returns', 'Purchase Returns', 'Handle damaged or rejected deliveries.'),
      ]),
    ],
    submodules: [
      { key: 'purchase-request-toggle', label: 'Purchase Request', enabled: true, description: 'Enable pre-order approval flow.' },
      { key: 'purchase-order-toggle', label: 'Purchase Order', enabled: true, description: 'Enable PO generation and supplier issue.' },
      { key: 'stock-received-toggle', label: 'Stock Received', enabled: true, description: 'Link procurement with warehouse intake.' },
    ],
  },
  {
    key: 'sales',
    label: 'Sales',
    iconKey: 'sales',
    accent: '#18a957',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Sales Today',
    kpiValue: '$45.2K',
    description: 'Quotes, orders, invoices, delivery, returns, and rental-linked billing.',
    statusNote: 'Shipping requests and invoice generation are on time.',
    detailBullets: [
      'Create quotations, sales orders, and invoices in one workflow.',
      'Monitor deliveries, returns, maintenance work, and customer stock.',
      'Support rental-generated invoices and monthly billing.',
    ],
    menus: [
      group('sales-commercial', 'Commercial', 'Sales offers and order capture.', [
        leaf('quotes', 'Quotes', 'Prepare customer quotations before commitment.'),
        leaf('sales-orders', 'List Sales Order', 'Track customer commitments before invoicing.'),
        leaf('sales-invoices', 'List Sales', 'Review invoices, balances, and dispatch readiness.'),
        leaf('monthly-auto-invoice', 'Monthly Auto Invoice', 'Generate recurring invoice batches.'),
      ]),
      group('sales-logistics', 'Delivery', 'Shipment and return handling.', [
        leaf('shipping-request', 'Shipping Request', 'Prepare and assign shipment work.'),
        leaf('delivery-note', 'Delivery Note', 'Track dispatched and delivered notes.'),
        leaf('sale-returns', 'List Returns', 'Handle sale returns, refunds, and stock re-entry.'),
      ]),
      group('sales-service', 'After Sales', 'Service and specialty flows.', [
        leaf('maintenance', 'Maintenance', 'Track post-sale maintenance requests and closures.'),
        leaf('consignment-sales', 'Consignments', 'Manage consignment-based sales documents.'),
        leaf('customer-stocks', 'Customer Stocks', 'Review stock held on behalf of customers.'),
        leaf('generated-invoice-list', 'List Generate Invoice', 'Track generated invoices for lease contracts.'),
      ]),
    ],
    submodules: [
      { key: 'quotation', label: 'Quotation', enabled: true, description: 'Enable quote-first sales workflow.' },
      { key: 'sale-order-toggle', label: 'Sale Order', enabled: true, description: 'Enable order staging before invoice.' },
      { key: 'delivery-toggle', label: 'Delivery', enabled: true, description: 'Enable shipping request and note flow.' },
      { key: 'maintenance-toggle', label: 'Maintenance', enabled: true, description: 'Attach post-sale service tasks.' },
    ],
  },
  {
    key: 'pos',
    label: 'Point Of Sale',
    iconKey: 'pos',
    accent: '#f2994a',
    enabled: true,
    health: 'watch',
    kpiLabel: 'Registers Live',
    kpiValue: '14',
    description: 'Cashier lanes, member cards, quick checkout, and customer stock support.',
    statusNote: 'One cash drawer is waiting for reconciliation.',
    detailBullets: [
      'Run retail checkout and cashier reporting from a live POS workspace.',
      'Manage gift cards, member cards, coupons, and loyalty-linked activity.',
      'Expose POS sales history and customer stock support.',
    ],
    menus: [
      leaf('pos-sales', 'POS Sales', 'Review cashier-generated orders and shift totals.'),
      leaf('pos-screen', 'POS Screen', 'Launch the live point-of-sale register screen.'),
      group('pos-loyalty', 'Membership', 'Cards, coupons, and benefits.', [
        leaf('gift-cards', 'Gift Cards', 'Track gift card issuance, balance, and redemption.'),
        leaf('member-cards', 'Member Cards', 'Manage loyalty cards and member benefit rules.'),
        leaf('member-coupon', 'Coupon', 'Control coupon generation and coupon usage.'),
      ]),
      leaf('pos-customer-stocks', 'Customer Stocks', 'Track stock held for POS-linked customers.'),
    ],
    submodules: [
      { key: 'member-card-toggle', label: 'Member Cards', enabled: true, description: 'Enable loyalty and member benefits.' },
      { key: 'coupon-toggle', label: 'Coupons', enabled: true, description: 'Enable coupon issuance and redemption.' },
    ],
  },
  {
    key: 'loans',
    label: 'Loans',
    iconKey: 'loans',
    accent: '#0c9b7a',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Active Loans',
    kpiValue: '1,284',
    description: 'Applications, borrowers, loan products, collections, and repayment monitoring.',
    statusNote: 'Missed repayment monitoring is current across branches.',
    detailBullets: [
      'Track loan applications, approved loans, and borrower profiles.',
      'Manage missed repayments, charges, and loan product setup.',
      'Provide a calculator lane for underwriting and schedule previews.',
    ],
    menus: [
      leaf('loan-applications', 'Applications', 'Review incoming and approved loan applications.'),
      leaf('loan-list', 'Loans', 'Track live loans, balances, and current statuses.'),
      leaf('missed-repayments', 'Missed Repayments', 'Monitor late or unpaid loan schedules.'),
      leaf('borrowers', 'Borrowers', 'Maintain borrower profiles and documents.'),
      leaf('loan-products', 'Loan Products', 'Configure product rules, terms, and rate structures.'),
      leaf('loan-calculator', 'Calculator', 'Preview repayment schedules and payment totals.'),
    ],
    submodules: [
      { key: 'loan-applications-toggle', label: 'Applications', enabled: true, description: 'Enable loan application intake.' },
      { key: 'loan-charges-toggle', label: 'Charges', enabled: true, description: 'Enable loan fee and charge setup.' },
    ],
  },
  {
    key: 'property',
    label: 'Property',
    iconKey: 'property',
    accent: '#7c6cf3',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Listings',
    kpiValue: '268',
    description: 'Property inventory, sales, booking, and commission control.',
    statusNote: 'Commission settlements and property blocking are aligned.',
    detailBullets: [
      'Track property sales, new listings, and booking flows.',
      'Maintain blocks, property types, units, and import templates.',
      'Provide a dedicated commission lane for payable balances.',
    ],
    menus: [
      group('property-sales-group', 'Sales', 'Commercial property actions.', [
        leaf('property-sales', 'List Sales', 'Track property-related sales and invoice status.'),
        leaf('property-add-sale', 'Add Sale', 'Create a new property sale entry.'),
        leaf('property-commission', 'Commission', 'Review commissions payable and settlement state.'),
      ]),
      group('property-master', 'Property Master', 'Listing and master data menus.', [
        leaf('property-blocks', 'Block', 'Maintain project blocks and building segmentation.'),
        leaf('property-list', 'List Property', 'Browse active, reserved, and blocked units.'),
        leaf('property-add', 'Add Property', 'Create a new listing with unit details.'),
        leaf('property-type', 'Property Type', 'Maintain property type master data.'),
        leaf('property-units', 'Units', 'Maintain unit definitions and measures.'),
        leaf('property-import', 'Import Property', 'Bulk import property records from templates.'),
      ]),
    ],
    submodules: [
      { key: 'property-booking-toggle', label: 'Booking', enabled: true, description: 'Enable reservation and blocking workflow.' },
      { key: 'property-commission-toggle', label: 'Commission', enabled: true, description: 'Enable commission settlements.' },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    iconKey: 'accounting',
    accent: '#5b6cff',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Close Accuracy',
    kpiValue: '99.2%',
    description: 'Journal, transactions, receivables, payables, treasury, and reconciliation.',
    statusNote: 'AR, AP, and treasury reports are balanced against the close pack.',
    detailBullets: [
      'Review journals and accounting transactions across source modules.',
      'Track receivables, payables, aging, and payment transfers.',
      'Monitor cash books, bank reconciliation, and treasury-linked settings.',
    ],
    menus: [
      group('accounting-ledgering', 'Ledgering', 'Journal and transaction views.', [
        leaf('journals', 'List Journal', 'Review posted and pending accounting entries.'),
        leaf('transactions', 'Transactions', 'Track cash, bank, and module-generated transactions.'),
        leaf('transfer-payment-report', 'Transfer Payment Report', 'Review transferred payments and audit references.'),
      ]),
      group('accounting-ar-ap', 'Receivables & Payables', 'Balance and aging views.', [
        leaf('receivables', 'List AC Receivable', 'Review the receivable list across customers.'),
        leaf('payables', 'Account Payable List', 'Review supplier payables and due balances.'),
        leaf('ar-by-customer', 'AR By Customer', 'Inspect receivable balances by customer.'),
        leaf('ap-by-supplier', 'AP By Supplier', 'Inspect payable balances by supplier.'),
        leaf('ar-aging', 'List AR Aging', 'Review AR aging buckets and overdue status.'),
        leaf('ap-aging', 'List AP Aging', 'Review AP aging buckets and due balances.'),
      ]),
      group('accounting-cash-bank', 'Cash & Bank', 'Treasury and reconciliation.', [
        leaf('cash-book', 'Cash Book', 'Track daily treasury movement and book balance.'),
        leaf('bank-reconcile', 'Bank Reconciliation', 'Match statement lines and resolve open items.'),
        leaf('bank-reconcile-report', 'Bank Reconciliation Report', 'Review completed bank reconciliation output.'),
      ]),
    ],
    submodules: [
      { key: 'bank-reconcile-toggle', label: 'Bank Reconcile', enabled: true, description: 'Enable bank matching workspace.' },
      { key: 'cash-accounts', label: 'Cash Accounts', enabled: true, description: 'Configure treasury cash accounts.' },
      { key: 'multi-biller', label: 'Multi Biller', enabled: true, description: 'Support multiple biller entities in accounting.' },
    ],
  },
  {
    key: 'hr',
    label: 'HR',
    iconKey: 'hr',
    accent: '#8b5cf6',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Active Staff',
    kpiValue: '126',
    description: 'Employees, departments, recruitment, ID cards, and staffing workflows.',
    statusNote: 'Permissions and staffing records are current.',
    detailBullets: [
      'Maintain employee records, departments, positions, and contract details.',
      'Handle recruitment, interviews, transfers, promotions, and warnings.',
      'Track document-heavy flows like ID cards and resignation records.',
    ],
    menus: [
      group('hr-people', 'People', 'Core employee and structure menus.', [
        leaf('employees', 'Employees', 'Review employee records and permissions.', { route: '/admins/users' }),
        leaf('departments', 'Departments', 'Maintain organizational unit structure.'),
        leaf('positions', 'Positions', 'Configure job positions and hierarchy.'),
        leaf('employee-groups', 'Groups', 'Manage employee grouping and classification.'),
      ]),
      group('hr-recruitment', 'Recruitment', 'Hiring and onboarding menus.', [
        leaf('recruitment', 'Recruitment', 'Track candidate intake and interview movement.'),
        leaf('shortlists', 'Shortlists', 'Manage shortlisted candidates and owner review.'),
        leaf('interviews', 'Interviews', 'Schedule and review interview outcomes.'),
      ]),
      group('hr-documents', 'Documents & Changes', 'Document-heavy HR actions.', [
        leaf('id-cards', 'ID Cards', 'Issue and manage staff ID card templates.'),
        leaf('contracts', 'Contracts', 'Track contracts, renewals, and expirations.'),
        leaf('promotions', 'Promotions', 'Track promotion movements and approvals.'),
        leaf('transfers', 'Transfers', 'Track internal employee transfers.'),
        leaf('resignations', 'Resignations', 'Maintain resignation records and final dates.'),
      ]),
    ],
    submodules: [
      { key: 'recruitment-toggle', label: 'Recruitment', enabled: true, description: 'Enable candidate and interview flow.' },
      { key: 'training-toggle', label: 'Training', enabled: true, description: 'Manage internal training sessions and trainers.' },
      { key: 'kpi-toggle', label: 'KPI', enabled: true, description: 'Track performance scorecards and review cycles.' },
    ],
  },
  {
    key: 'payroll',
    label: 'Payroll',
    iconKey: 'payroll',
    accent: '#0bb07b',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Next Payroll',
    kpiValue: '4 days',
    description: 'Salaries, benefits, advances, payslips, and payroll payment tracking.',
    statusNote: 'Pre-salary validation is nearly complete for the next cycle.',
    detailBullets: [
      'Generate pre-salaries, salary batches, and payment-ready files.',
      'Manage benefits, benefit details, cash advances, and deductions.',
      'Track payslips, bank notes, and salary reporting outputs.',
    ],
    menus: [
      group('payroll-processing', 'Processing', 'Payroll generation and review.', [
        leaf('pre-salaries', 'Pre Salaries', 'Validate payroll input before the final cycle locks.'),
        leaf('pre-salary-details', 'Pre Salary Details', 'Inspect employee-level draft salary output.'),
        leaf('pre-salary-groups', 'Pre Salary Groups', 'Compare draft salaries by group and branch.'),
        leaf('salaries', 'Salaries', 'Review the processed salary cycle.'),
        leaf('salary-details', 'Salary Details', 'Open employee-level salary detail views.'),
      ]),
      group('payroll-disbursement', 'Disbursement', 'Payment, notes, and payslips.', [
        leaf('salary-bank-notes', 'Salary Bank Notes', 'Prepare salary bank note files and exports.'),
        leaf('payslips', 'Payslips', 'Review and issue employee payslips.'),
        leaf('payments', 'Payments', 'Track salary disbursement completion and failures.'),
      ]),
      group('payroll-benefits', 'Benefits & Advances', 'Benefit and advance management.', [
        leaf('cash-advances', 'Cash Advances', 'Track employee salary advances and deductions.'),
        leaf('benefits', 'Benefits', 'Maintain benefit rules and coverage.'),
        leaf('benefit-details', 'Benefit Details', 'Review employee-specific benefit lines.'),
        leaf('nssf', 'NSSF', 'Track payroll-linked NSSF reporting support.'),
      ]),
    ],
    submodules: [
      { key: 'cash-advance-toggle', label: 'Cash Advance', enabled: true, description: 'Enable salary advance workflow.' },
      { key: 'benefit-reporting-toggle', label: 'Benefit Reporting', enabled: true, description: 'Include benefit detail reporting.' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    iconKey: 'reports',
    accent: '#0099cc',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Report Packs',
    kpiValue: '62',
    description: 'Nested inventory, sales, people, HR, payroll, finance, and specialty report packs.',
    statusNote: 'Scheduled exports and report pack queues completed successfully.',
    detailBullets: [
      'Run report packs by operational area with grouped and nested menus.',
      'Keep people, HR, payroll, and finance reports in a single ERP rail.',
      'Expose specialty report groups for property and loans.',
    ],
    menus: [
      group('reports-inventory', 'Inventory Report', 'Stock and warehouse reporting.', [
        leaf('report-stock-value', 'Stock Value', 'Review stock value across branches and warehouses.'),
        leaf('report-product-quantity', 'Product Quantity', 'Compare product-level stock quantity positions.'),
        leaf('report-expiry', 'Expiry Report', 'Track items nearing expiry or aging out.'),
      ], { tone: 'report' }),
      group('reports-sales', 'Sales Report', 'Commercial and revenue reporting.', [
        leaf('report-sales', 'Sales Report', 'Review daily and period sales performance.'),
        leaf('report-sale-items', 'Sale Items Report', 'Compare sales by product line and item.'),
        leaf('report-profit-loss', 'Profit & Loss Table', 'Review profitability by period.'),
      ], { tone: 'report' }),
      group('reports-property', 'Property Report', 'Property and leasing report packs.', [
        leaf('report-commission', 'Commission Report', 'Review property commission statements.'),
        leaf('report-booking', 'Booking Report', 'Track property booking status and volume.'),
        leaf('report-blocking', 'Blocking Report', 'Review blocked property units and timing.'),
      ], { tone: 'report' }),
      group('reports-people', 'People Report', 'Supplier, customer, and staff reports.', [
        leaf('report-suppliers', 'Suppliers Report', 'Review supplier activity and balances.'),
        leaf('report-customers', 'Customers Report', 'Review customer activity and purchase behavior.'),
        leaf('report-staff', 'Staff Report', 'Inspect employee and user activity reporting.'),
      ], { tone: 'report' }),
      group('reports-hr', 'HR Report', 'Human resources reporting packs.', [
        leaf('report-employees', 'Employees Report', 'Review employee population and status summaries.'),
        leaf('report-contracts', 'Contracts Report', 'Review contract coverage and renewals.'),
        leaf('report-promotions', 'Promotions Report', 'Review promotion activity.'),
      ], { tone: 'report' }),
      group('reports-payroll', 'Payroll Report', 'Payroll analytics and output files.', [
        leaf('report-pre-salaries', 'Pre Salaries Report', 'Review draft payroll totals.'),
        leaf('report-salaries', 'Salaries Report', 'Review posted payroll totals.'),
        leaf('report-payslips', 'Payslips Report', 'Review generated payslip output.'),
        leaf('report-payments', 'Payments Report', 'Review payroll disbursement activity.'),
      ], { tone: 'report' }),
      group('reports-account', 'Accounts', 'Finance and treasury reporting.', [
        leaf('report-payments-main', 'Payments Report', 'Review general payment activity across modules.'),
        leaf('report-cash-management', 'Cash Management Report', 'Review cash account movement.'),
        group('reports-account-statements', 'Statements', 'Ledger and financial statements.', [
          leaf('report-ledger', 'Ledger', 'Open general ledger output.'),
          leaf('report-trial-balance', 'Trial Balance', 'Review the current trial balance.'),
          leaf('report-income-statement', 'Income Statement', 'Review income statement output.'),
          leaf('report-balance-sheet', 'Balance Sheet', 'Open the balance sheet report.'),
          leaf('report-cash-flow', 'Cashflow Report', 'Review the cash flow statement.'),
        ], { tone: 'report' }),
      ], { tone: 'report' }),
      group('reports-loans', 'Loans Report', 'Loan and collection reporting.', [
        leaf('report-loans', 'Loans Report', 'Review loan portfolio performance.'),
        leaf('report-loan-collection', 'Loan Collection Report', 'Review collection behavior and overdue movement.'),
        leaf('report-loan-disbursement', 'Loan Disbursement Report', 'Review disbursement volume and timing.'),
      ], { tone: 'report' }),
    ],
    submodules: [
      { key: 'inventory-pack', label: 'Inventory Pack', enabled: true, description: 'Enable warehouse and stock reporting.' },
      { key: 'sales-pack', label: 'Sales Pack', enabled: true, description: 'Enable revenue and order reporting.' },
      { key: 'finance-pack', label: 'Finance Pack', enabled: true, description: 'Enable AR, AP, and accounting reporting.' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    iconKey: 'settings',
    accent: '#6b7280',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Policies Live',
    kpiValue: '31',
    description: 'System settings, product masters, roles, backup, and platform-wide policies.',
    statusNote: 'No configuration drift is visible across active branches.',
    detailBullets: [
      'Maintain system, accounting, and POS-level global settings.',
      'Manage categories, brands, units, warehouses, users, and role groups.',
      'Control backups, language, and broader platform defaults.',
    ],
    menus: [
      // In the settings module menus
      group('settings-organization', 'Branches', 'Multi-shop and branch location controls.', [
        leaf('branches', 'Branches & Shops', 'Control multi-branch shop locations, registers, and operations.', { 
          route: '/admins/settings/branches' 
        }),
      ]),
      group('settings-system', 'System', 'Core ERP configuration.', [
        leaf('system-settings', 'System Settings', 'Open global ERP policies and configuration.', { 
          route: '/admins?module=settings&menu=system-settings' 
        }),
        leaf('module-settings', 'Modules Switchboard', 'Open or close ERP modules and toggle visibility.', {
          route: '/admins/modules'
        }),
        leaf('pos-settings', 'POS Settings', 'Manage cashier and POS-specific defaults.'),
      ]),
      group('settings-product-master', 'Product Master', 'Shared master data menus.', [
        leaf('categories', 'Categories', 'Maintain the category tree used by storefront and ERP.', { route: '/admins/settings/categories' }),
        leaf('brands', 'Brands', 'Maintain brand master data.'),
        leaf('units', 'Units', 'Maintain item unit definitions.'),
        leaf('warehouses', 'Warehouses & Branches', 'Maintain warehouse and location records.', { route: '/admins/settings/branches' }),
      ]),
      group('settings-access', 'Access & Governance', 'Users, roles, and security audit.', [
        leaf('user-groups', 'Roles & Ingress Policies', 'Define role permissions and access boundaries.', { route: '/admins/access-control' }),
        leaf('permissions', 'Permission Matrix (777 Keys)', 'Configure normalized group permission matrix.', { route: '/admins/settings/permissions' }),
        leaf('supplier-approvals', 'Supplier Approvals', 'Verify and approve supplier registrations.', { route: '/admins?module=settings&menu=supplier-approvals' }),
        leaf('users', 'Users Directory', 'Maintain users and operator permissions.', { route: '/admins/settings/users' }),
        leaf('audit-trails', 'Security & Audit Logs', 'Real-time login telemetry and audit trails.', { route: '/admins?module=settings&menu=audit-trails' }),
        leaf('backups', 'Backups', 'Check backup integrity and restore readiness.'),
        leaf('languages', 'Languages', 'Control installed languages and defaults.'),
      ]),
    ],
    submodules: [
      { key: 'multi-level', label: 'Multi Level', enabled: true, description: 'Enable layered settings by business unit.' },
      { key: 'multi-biller-toggle', label: 'Multi Biller', enabled: true, description: 'Enable multiple biller entities.' },
      { key: 'api-keys-toggle', label: 'API Keys', enabled: true, description: 'Expose API and connector access.' },
    ],
  },
  {
    key: 'front-end',
    label: 'Front End',
    iconKey: 'frontEnd',
    accent: '#a855f7',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Live Stores & SKUs',
    kpiValue: '8 Stores / 120 SKUs',
    description: 'Master owner control room for public website display, multi-store channels, catalog visibility, and hero slider content.',
    statusNote: 'Real-time synchronization between Admin changes and public customer website.',
    detailBullets: [
      'Control storefront appearance, homepage layout, announcements, and featured stores.',
      'Control all stores: website visibility, featured status, operating hours, and ordering options.',
      'Control products of each store: storefront visibility, store assignment, badge, pricing, and stock status.',
      'Manage hero sliders, promo banners, and static pages.',
    ],
    menus: [
      group('frontend-channels', 'Stores & Catalog', 'Manage store channels and products.', [
        leaf('shop-control', 'Stores Controller', 'Control all stores displayed on the website, ordering, and featured tags.', { route: '/admins?module=front-end&menu=shop-control' }),
        leaf('store-products', 'Products of Store', 'Control products per store, visibility, price overrides, and featured tags.', { route: '/admins?module=front-end&menu=store-products' }),
        leaf('telegram-groups', 'Telegram Groups & Bots', 'Multi-store group management, bot permissions & group ID setup.', { route: '/admins?module=front-end&menu=telegram-groups' }),
      ]),
      group('frontend-display', 'Website Display', 'Storefront presentation, themes, and banners.', [
        leaf('website-display', 'Website Display & Theme', 'Homepage layout, announcement bar, themes, and branding.', { route: '/admins?module=front-end&menu=website-display' }),
        leaf('slider-settings', 'Hero Sliders & Banners', 'Manage hero slider slides, images, promo banners, and links.', { route: '/admins?module=front-end&menu=slider-settings' }),
        leaf('list-pages', 'Website Pages', 'Review and edit public storefront information and policy pages.', { route: '/admins?module=front-end&menu=list-pages' }),
      ]),
    ],
    submodules: [
      { key: 'frontend-stores-toggle', label: 'Stores Controller', enabled: true, description: 'Control store visibility on website.' },
      { key: 'frontend-products-toggle', label: 'Store Products', enabled: true, description: 'Control products per store.' },
      { key: 'frontend-slider-toggle', label: 'Slider & Banners', enabled: true, description: 'Enable slider content controls.' },
    ],
  },
];

export const moduleHealthLabel = {
  stable: 'Stable',
  watch: 'Watch',
  paused: 'Paused',
};

const visitMenuTree = (items = [], visitor, path = []) => {
  items.forEach((item) => {
    const nextPath = [...path, item];
    visitor(item, nextPath);
    if (item.children?.length) {
      visitMenuTree(item.children, visitor, nextPath);
    }
  });
};

const findMenuPath = (items = [], targetKey, path = []) => {
  for (const item of items) {
    const nextPath = [...path, item];
    if (item.key === targetKey) {
      return nextPath;
    }
    if (item.children?.length) {
      const childPath = findMenuPath(item.children, targetKey, nextPath);
      if (childPath) {
        return childPath;
      }
    }
  }
  return null;
};

export const flattenMenuItems = (items = []) => {
  const flattened = [];

  visitMenuTree(items, (item, path) => {
    if (!item.children?.length) {
      flattened.push({
        ...item,
        groupPath: path.slice(0, -1).map((entry) => entry.label),
        keyPath: path.map((entry) => entry.key),
      });
    }
  });

  return flattened;
};

export const countLeafMenus = (items = []) => flattenMenuItems(items).length;

export const getModuleByKey = (moduleKey) =>
  erpModules.find((module) => module.key === moduleKey) || erpModules[0];

export const getDefaultMenu = (moduleKey) => flattenMenuItems(getModuleByKey(moduleKey)?.menus || [])[0];

export const getDefaultMenuKey = (moduleKey) => getDefaultMenu(moduleKey)?.key || null;

export const getMenuByKey = (moduleKey, menuKey) => {
  const module = getModuleByKey(moduleKey);
  const flattened = flattenMenuItems(module.menus);

  return flattened.find((item) => item.key === menuKey) || flattened[0];
};

export const getMenuLineage = (moduleKey, menuKey) => {
  const module = getModuleByKey(moduleKey);
  const matchedPath = findMenuPath(module.menus, menuKey);
  if (matchedPath?.length) {
    return matchedPath.map((item) => item.key);
  }
  return getDefaultMenu(moduleKey)?.keyPath || [];
};

export const buildModulePath = (moduleKey, menuKey) => {
  if (!moduleKey) {
    return '/admins';
  }

  const menuConfig = getMenuByKey(moduleKey, menuKey);
  if (menuConfig?.route) {
    return menuConfig.route;
  }

  const params = new URLSearchParams({ module: moduleKey });
  const resolvedMenuKey = menuConfig?.key || getDefaultMenuKey(moduleKey);
  if (resolvedMenuKey) {
    params.set('menu', resolvedMenuKey);
  }

  return `/admins?${params.toString()}`;
};
