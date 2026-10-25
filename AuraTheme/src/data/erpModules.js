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
  // 1. INVENTORY (Products, Transfers, Adjustments, Barcodes, Counts)
  {
    key: 'inventory',
    label: 'Inventory',
    iconKey: 'inventory',
    accent: '#0a84ff',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Tracked SKUs',
    kpiValue: '12.4K',
    description: 'Products, stock counts, adjustments, transfers, receiving, and barcode movement control.',
    statusNote: 'Cycle count variance remains below target.',
    detailBullets: [
      'Manage catalog, multi-warehouse quantities, barcode labels, and Excel imports.',
      'Conduct stock counts, quantity adjustments, cost adjustments, and internal stock usage.',
      'Control multi-warehouse transfers, supplier consignments, and customer reward exchanges.',
    ],
    menus: [
      group('inventory-catalog', 'Catalog', 'Core product master menus.', [
        leaf('products', 'List Products', 'Review live catalog and stock list across warehouses.', { route: '/admins/products' }),
        leaf('add-product', 'Add Product', 'Create new products with pricing and stock defaults.', { route: '/admins/products?action=add' }),
        leaf('import-products', 'Import Products', 'Bulk import products from Excel or CSV templates.', { route: '/admins/products?action=import' }),
        leaf('print-barcodes', 'Print Barcode Label', 'Prepare barcode and shelf labels for thermal or sheet printers.', { route: '/admins/products?action=barcode' }),
      ]),
      group('inventory-counts-adjustments', 'Counts & Adjustments', 'Physical audit and inventory reconciliation.', [
        leaf('stock-counts', 'Stock Counts', 'Perform cycle counts and reconcile physical inventory with system records.', { route: '/admins/products?tab=stock-counts' }),
        leaf('quantity-adjustments', 'Quantity Adjustments', 'Record damaged, missing, expired, or found stock items.', { route: '/admins/products?tab=quantity-adjustments' }),
        leaf('cost-adjustments', 'Cost Adjustments', 'Revalue product purchase costs and update valuation history.', { route: '/admins/products?tab=cost-adjustments' }),
        leaf('add-cost-adjustment', 'Add Cost Adjustment', 'Create a new cost revaluation voucher for products.', { route: '/admins/products/cost_adjustments/add' }),
      ]),
      group('inventory-movement', 'Stock Movement', 'Internal usage, receiving, and transfers.', [
        leaf('using-stock', 'Stock Using', 'Record operational consumption and internal branch material use.', { route: '/admins/products?tab=using-stock' }),
        leaf('stock-received', 'Stock Received', 'Review warehouse receipts against incoming purchase shipments.', { route: '/admins/products?tab=stock-received' }),
        leaf('transfers', 'List Transfers', 'Dispatch, track, and receive inventory across multi-branch warehouses.', { route: '/admins/transfers' }),
        leaf('add-transfer', 'Add Transfer', 'Create a new warehouse inventory transfer request or order.', { route: '/admins/transfers/add' }),
        leaf('consignments', 'Consignments', 'Track supplier consignments and consignment customer agreements.', { route: '/admins/products?tab=consignments' }),
        leaf('rewards-exchange', 'Rewards Exchange', 'Process customer points exchange and ring gifts catalog.', { route: '/admins/products?tab=rewards-exchange' }),
      ]),
    ],
    submodules: [
      { key: 'multi-warehouse', label: 'Multi Warehouse', enabled: true, description: 'Track stock across multiple storage depots.' },
      { key: 'stock-using-toggle', label: 'Stock Using', enabled: true, description: 'Allow store expense / stock consumption entries.' },
      { key: 'reward-exchange', label: 'Reward Exchange', enabled: true, description: 'Enable point redemption and rewards exchange.' },
    ],
  },

  // 2. PROCUREMENT / PURCHASES
  {
    key: 'procurement',
    label: 'Procurement',
    iconKey: 'procurement',
    accent: '#10b981',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Open POs',
    kpiValue: '34 Orders',
    description: 'Purchase requests, purchase orders, vendor invoices, receiving, and vendor returns.',
    statusNote: 'Vendor delivery SLAs averaging 98.4% on-time.',
    detailBullets: [
      'Submit and approve purchase requests from operational departments.',
      'Issue vendor Purchase Orders and track goods receipts.',
      'Reconcile AP requested invoices and process return shipments.',
    ],
    menus: [
      leaf('purchase-requests', 'Purchase Request', 'Review purchase requisitions waiting for approval.'),
      leaf('purchase-orders', 'Purchase Order', 'Generate and track confirmed purchase orders issued to suppliers.'),
      leaf('purchases-list', 'List Purchases', 'Browse purchase invoices, supplier bills, and payment statuses.', { route: '/admins?module=procurement&menu=purchases-list' }),
      leaf('purchase-by-csv', 'Purchase by Excel', 'Upload supplier shipments in bulk via standardized spreadsheets.'),
      leaf('ap-requested', 'AP Requested', 'Track vendor payment requests awaiting financial authorization.'),
      leaf('purchase-returns', 'Purchase Returns', 'Manage vendor debit memos and returned inventory items.'),
    ],
    submodules: [
      { key: 'purchase-request-toggle', label: 'Purchase Request', enabled: true, description: 'Enable multi-tier PR approval workflow.' },
      { key: 'purchase-order-toggle', label: 'Purchase Order', enabled: true, description: 'Formalize vendor agreements via POs.' },
      { key: 'stock-received-toggle', label: 'Stock Received', enabled: true, description: 'Require GRN confirmation before payment.' },
    ],
  },

  // 3. SALES & DISTRIBUTION
  {
    key: 'sales',
    label: 'Sales',
    iconKey: 'sales',
    accent: '#3b82f6',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Monthly Sales',
    kpiValue: '$184.2K',
    description: 'Quotations, sales orders, tax invoices, shipping requests, deliveries, and customer returns.',
    statusNote: 'All orders synchronized with warehouse dispatch queues.',
    detailBullets: [
      'Generate quotations, price comparisons, and convert to Sales Orders.',
      'Issue official VAT invoices and manage monthly recurring billing.',
      'Coordinate logistics delivery notes and dispatch fleet schedules.',
    ],
    menus: [
      group('sales-quotes', 'Quotations', 'Presales estimates and quotes.', [
        leaf('quotes', 'Quotes', 'Draft and send customer quotations.'),
        leaf('quotes-comparison', 'Quotes Comparison', 'Compare multi-vendor price quotations side-by-side.'),
      ]),
      group('sales-orders-group', 'Orders & Invoices', 'Commercial sales execution.', [
        leaf('add-sale', 'Add Sale', 'Create and issue a new commercial sales order or invoice.', { route: '/admins/sales/add' }),
        leaf('sales-list', 'List Sales', 'Browse sales invoices, receipts, and order statuses.', { route: '/admins/sales' }),
        leaf('monthly-auto-invoice', 'Monthly Auto Invoice', 'Automate recurring monthly retainer and subscription invoices.'),
        leaf('tax-invoices', 'List Invoices (Tax)', 'Generate and file official tax compliance invoices.'),
      ]),
      group('sales-fulfillment', 'Fulfillment & Returns', 'Logistics delivery and RMA returns.', [
        leaf('shipping-requests', 'Shipping Request', 'Pick/pack staging requests sent to fulfillment team.'),
        leaf('deliveries', 'Delivery Notes', 'Dispatch receipts with carrier tracking and proof of delivery.'),
        leaf('sale-returns', 'List Returns', 'Process customer returns, credit notes, and restock inspections.'),
        leaf('maintenance', 'Maintenance', 'Track post-sale servicing, warranty, and technician visits.'),
        leaf('sale-consignments', 'Consignments', 'Manage customer consignment agreements and stock reconciliation.'),
        leaf('fuel-sales', 'Fuel Sales', 'Record meter readings and bulk petroleum sales transactions.'),
        leaf('concrete-sales', 'Sale Concretes', 'Manage ready-mix concrete plant sales and cubic meter dispatches.'),
      ]),
    ],
    submodules: [
      { key: 'quotation', label: 'Quotation', enabled: true, description: 'Allow presales quotation generation.' },
      { key: 'sale-order-toggle', label: 'Sale Order', enabled: true, description: 'Enable sales order confirmation workflow.' },
      { key: 'delivery-toggle', label: 'Delivery', enabled: true, description: 'Manage delivery notes and logistics dispatch.' },
      { key: 'maintenance-toggle', label: 'Maintenance', enabled: true, description: 'Enable post-sale maintenance service.' },
    ],
  },

  // 4. POINT OF SALE (POS)
  {
    key: 'pos',
    label: 'POS',
    iconKey: 'pos',
    accent: '#f59e0b',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Registers Online',
    kpiValue: '8 Active',
    description: 'Fast register checkout, touchscreen POS, cash drawer reconciliation, gift cards, and coupons.',
    statusNote: 'Dual offline-first register cache with cloud sync.',
    detailBullets: [
      'Launch cashier terminals with barcode scanning and instant tender.',
      'Issue and redeem gift cards, membership loyalty cards, and coupons.',
      'Control customer reserve stocks and cashier register shift closes.',
    ],
    menus: [
      leaf('list_pos', 'List POS', 'Browse live counter POS transactions, sales register, and receipt history.', { route: '/admins/pos?tab=sales' }),
      leaf('pos-screen', 'Open POS Terminal', 'Launch the fast counter touch-screen checkout register.', { route: '/admins/pos' }),
      leaf('pos-settings', 'POS Settings', 'Default POS register behaviors, sound effects, receipt printers, and cash drawer pins.', { route: '/admins/pos/settings' }),
      leaf('gift-cards', 'Gift Cards', 'Issue stored-value prepaid gift cards and check balances.'),
      leaf('member-cards', 'Member Cards', 'Manage customer VIP membership cards, tiers, and loyalty points.'),
      leaf('coupons', 'Coupons', 'Issue percentage and fixed promotional voucher codes.'),
      leaf('customer-stocks', 'Customer Stocks', 'Manage prepaid customer stock held in store for later redemption.'),
    ],
    submodules: [
      { key: 'member-card-toggle', label: 'Member Cards', enabled: true, description: 'Enable customer loyalty point tracking.' },
      { key: 'coupon-toggle', label: 'Coupons', enabled: true, description: 'Support promotional coupon campaigns.' },
    ],
  },

  // 5. ASSETS & EQUIPMENT
  {
    key: 'asset',
    label: 'Assets',
    iconKey: 'asset',
    accent: '#8b5cf6',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Total Fixed Assets',
    kpiValue: '$420K',
    description: 'Fixed asset registers, procurement expenses, straight-line depreciation, and asset evaluation.',
    statusNote: 'Quarterly asset depreciation run completed.',
    detailBullets: [
      'Maintain asset registers with serial numbers, tags, and physical locations.',
      'Track capitalized asset expenses and ongoing maintenance costs.',
      'Compute automated depreciation schedules and periodic asset revaluations.',
    ],
    menus: [
      leaf('assets-list', 'List Assets', 'Review fixed asset inventory, serial numbers, and book values.'),
      leaf('add-asset', 'Add Asset', 'Register new capital equipment with depreciation schedule.'),
      leaf('asset-expenses', 'Asset Purchases & Expenses', 'Capitalized acquisition costs and equipment servicing.'),
      leaf('asset-depreciation', 'Depreciation Schedule', 'Calculate monthly and yearly depreciation book amortizations.'),
      leaf('asset-evaluation', 'Asset Evaluation', 'Record physical condition assessments and revaluation reserves.'),
      leaf('asset-stock-using', 'Asset Stock Using', 'Track parts and supplies allocated for equipment maintenance.'),
    ],
    submodules: [
      { key: 'asset-expense-toggle', label: 'Asset Expenses', enabled: true, description: 'Capitalize maintenance and servicing costs.' },
      { key: 'asset-evaluation-toggle', label: 'Evaluation', enabled: true, description: 'Enable periodic fair-market asset evaluation.' },
      { key: 'asset-stock-toggle', label: 'Stock Using', enabled: true, description: 'Allocate spare parts to asset repairs.' },
    ],
  },

  // 6. VEHICLES & LEASING
  {
    key: 'leasing',
    label: 'Leasing / Vehicles',
    iconKey: 'leasing',
    accent: '#0284c7',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Fleet Leases',
    kpiValue: '28 Contracts',
    description: 'Vehicle fleet management, equipment lease contracts, recurring billing, and blacklist records.',
    statusNote: 'All active lease contracts inspected and compliant.',
    detailBullets: [
      'Manage fleet vehicles, chassis numbers, odometer readings, and insurance.',
      'Issue vehicle lease contracts with customized monthly repayment terms.',
      'Track defaulters and enforce lease termination / repossession protocols.',
    ],
    menus: [
      leaf('leasing-assets', 'List Fleet Assets', 'Vehicle fleet register with license plates and odometer metrics.'),
      leaf('leases-list', 'Lease Contracts', 'Active and historical rental / leasing agreements.'),
      leaf('leasing-invoices', 'Generate Invoices', 'Monthly recurring rental invoices generated for fleet tenants.'),
      leaf('leasing-blacklists', 'Blacklist', 'Track high-risk borrowers and non-paying lessees.'),
      leaf('leasing-end', 'End Leasing', 'Process lease conclusion, damage assessment, and deposit refunds.'),
    ],
    submodules: [
      { key: 'leasing-billing', label: 'Auto Recurring Billing', enabled: true, description: 'Automatically generate monthly lease charges.' },
      { key: 'leasing-blacklists-toggle', label: 'Blacklist Governance', enabled: true, description: 'Enforce risk checks against defaulting clients.' },
    ],
  },

  // 7. CRM & LEADS
  {
    key: 'crm',
    label: 'CRM & Leads',
    iconKey: 'crm',
    accent: '#ec4899',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Pipeline Value',
    kpiValue: '$94.5K',
    description: 'Lead generation, sales pipeline stages, interaction logs, customer groups, and lead conversion.',
    statusNote: 'Lead-to-quote conversion rate at 24.2%.',
    detailBullets: [
      'Capture prospects from web inquiries, telegram channels, and events.',
      'Organize leads into pipeline stages (New, Qualified, Proposal, Won).',
      'Analyze salesperson performance and pipeline forecasting velocity.',
    ],
    menus: [
      leaf('leads-groups', 'Lead Groups', 'Segment prospects by industry, acquisition channel, and buyer personas.'),
      leaf('leads-list', 'Leads', 'Browse incoming prospective clients and contact history.'),
      leaf('add-lead', 'Add Lead', 'Create new prospective customer profile with inquiry details.'),
      leaf('leads-pipeline', 'Sales Pipeline', 'Visual kanban pipeline for opportunity deal progression.'),
      leaf('leads-report', 'Leads Report', 'Conversion velocity, channel effectiveness, and conversion rates.'),
    ],
    submodules: [
      { key: 'crm-pipeline', label: 'Kanban Pipeline', enabled: true, description: 'Visual drag-and-drop stage progression.' },
      { key: 'crm-reports', label: 'Conversion Telemetry', enabled: true, description: 'Analyze channel acquisition metrics.' },
    ],
  },

  // 8. PROPERTIES & REAL ESTATE
  {
    key: 'property',
    label: 'Properties',
    iconKey: 'property',
    accent: '#14b8a6',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Units Listed',
    kpiValue: '142 Units',
    description: 'Property sales, land blocks, residential units, property types, and agent commission payouts.',
    statusNote: 'Block Phase 2 sales currently active.',
    detailBullets: [
      'Catalog land plots, borey houses, condos, commercial blocks, and units.',
      'Manage sales agreements, installment terms, and downpayment schedules.',
      'Calculate broker and agency commissions on closed property transactions.',
    ],
    menus: [
      leaf('property-sales', 'List Sales', 'Review confirmed property purchase and reservation contracts.'),
      leaf('property-add-sale', 'Add Sale', 'Initiate a new property purchase contract with buyer schedule.'),
      leaf('property-blocks', 'Blocks', 'Manage project zones, phases, and land demarcations.'),
      leaf('property-list', 'List Property', 'Browse available properties, blueprints, and sales statuses.'),
      leaf('property-add', 'Add Property', 'Register a new property listing with dimensions and pricing.'),
      leaf('property-types', 'Property Type', 'Define structural classifications (Villa, Shophouse, Land, Condo).'),
      leaf('property-units', 'Units', 'Unit numbers, floor levels, square meterage, and orientation.'),
      leaf('property-import', 'Import Property', 'Bulk import real estate master records via Excel files.'),
    ],
    submodules: [
      { key: 'property-booking-toggle', label: 'Booking & Reservations', enabled: true, description: 'Support temporary deposit holds.' },
      { key: 'property-commission-toggle', label: 'Commission Calculation', enabled: true, description: 'Automate sales agent commission splits.' },
    ],
  },

  // 9. COMMISSIONS
  {
    key: 'commission',
    label: 'Commissions',
    iconKey: 'commission',
    accent: '#d97706',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Payable Balance',
    kpiValue: '$18.4K',
    description: 'Sales agent commissions payable, tier compensation matrices, and payout disbursement logs.',
    statusNote: 'Current commission run approved for settlement.',
    detailBullets: [
      'Track sales agent and referral commission accruals per completed deal.',
      'Define percentage and tiered bonus rates based on volume thresholds.',
      'Review pending payouts and export banking disbursement batches.',
    ],
    menus: [
      leaf('commissions-payable', 'Commissions Payable', 'Browse accrued commissions awaiting disbursement approval.'),
      leaf('commission-agents', 'Commission Agents', 'Registered external brokers and sales representatives.'),
      leaf('commission-rates', 'Commission Rates', 'Configure percentage and tiered bonus structures.'),
    ],
    submodules: [
      { key: 'tiered-commissions', label: 'Tiered Payout Rules', enabled: true, description: 'Reward volume milestones with escalating rates.' },
    ],
  },

  // 10. LOANS & MICROFINANCE
  {
    key: 'loans',
    label: 'Loans',
    iconKey: 'loans',
    accent: '#059669',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Loan Portfolio',
    kpiValue: '$840K',
    description: 'Loan applications, disbursements, borrower KYC, missed repayment alerts, and loan products.',
    statusNote: 'Portfolio at risk (PAR > 30 days) maintained under 2.1%.',
    detailBullets: [
      'Process credit underwriting, collateral valuation, and loan disbursement.',
      'Monitor repayment amortization schedules and flag overdue installments.',
      'Manage loan products, interest rate formulas, and loan service charges.',
    ],
    menus: [
      leaf('loan-applications', 'Applications', 'Underwriting queue for borrower loan submissions.'),
      leaf('loans-list', 'List Loans', 'Active disbursed loan portfolio with outstanding balances.'),
      leaf('missed-repayments', 'Missed Repayments', 'Delinquent borrowers with overdue principal or interest.'),
      leaf('loan-borrowers', 'Borrowers', 'Customer KYC profiles, collateral pledges, and credit history.', { route: '/admins?module=loans&menu=loan-borrowers' }),
      leaf('loan-products', 'Loan Products', 'Configure declining balance, flat, and balloon interest terms.'),
      leaf('loan-charges', 'Loan Charges', 'Processing fees, late penalties, and document verification costs.'),
      leaf('loan-calculator', 'Loan Calculator', 'Interactive amortization schedule estimator for borrowers.'),
    ],
    submodules: [
      { key: 'loan-applications-toggle', label: 'Applications', enabled: true, description: 'Support multi-step credit committee approvals.' },
      { key: 'loan-charges-toggle', label: 'Charges', enabled: true, description: 'Automate penalty fees on late installments.' },
    ],
  },

  // 11. PAWNSHOP
  {
    key: 'pawns',
    label: 'Pawns',
    iconKey: 'pawns',
    accent: '#ca8a04',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Pledged Items',
    kpiValue: '215 Assets',
    description: 'Collateral pledges, jewelry and gold evaluations, pawn tickets, interest redemption, and forfeiture.',
    statusNote: 'All vault collateral audited and securely stored.',
    detailBullets: [
      'Appraise precious metals, electronics, and vehicles with instant cash disbursement.',
      'Issue official pawn tickets with monthly interest accumulation rules.',
      'Process ticket redemption, extensions, and liquidated forfeiture sales.',
    ],
    menus: [
      leaf('pawns-list', 'Pawn List', 'Active collateral tickets, valuation amounts, and expiry dates.'),
      leaf('add-pawn', 'Add Pawn Ticket', 'Issue new pawn collateral ticket and disburse funds.'),
      leaf('pawn-purchases', 'Pawn Purchases', 'Record outright cash purchases of customer valuables.'),
      leaf('return-pawn', 'Return Pawn Collateral', 'Process full principal plus interest repayment and return pledged item.'),
    ],
    submodules: [
      { key: 'gold-pricing', label: 'Live Gold Rate Feeds', enabled: true, description: 'Sync karat valuation with international market bullion.' },
    ],
  },

  // 12. SAVINGS & DEPOSITS
  {
    key: 'savings',
    label: 'Savings',
    iconKey: 'savings',
    accent: '#0d9488',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Member Deposits',
    kpiValue: '$1.25M',
    description: 'Member savings accounts, term deposits, daily cash deposits, withdrawals, and interest postings.',
    statusNote: 'Monthly savings interest accrual completed.',
    detailBullets: [
      'Maintain member passbooks, current accounts, and fixed-term deposits.',
      'Process counter teller cash deposits and authorized withdrawals.',
      'Calculate and post automated daily/monthly compound interest.',
    ],
    menus: [
      leaf('savings-accounts', 'Saving Accounts', 'Directory of active customer savings passbooks and balances.'),
      leaf('savings-deposits', 'Deposits', 'Process counter cash inflows with passbook printouts.'),
      leaf('savings-withdrawals', 'Withdrawals', 'Authorize counter withdrawals subject to reserve balances.'),
      leaf('savings-rates', 'Interest Rates', 'Configure standard and fixed deposit annual percentage yields.'),
    ],
    submodules: [
      { key: 'savings-passbook', label: 'Passbook Printing', enabled: true, description: 'Support dot-matrix teller passbook printer commands.' },
    ],
  },

  // 13. INSTALLMENT SALES
  {
    key: 'installments',
    label: 'Installments',
    iconKey: 'installments',
    accent: '#4f46e5',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Active Plans',
    kpiValue: '310 Plans',
    description: 'Retail consumer financing, installment contracts, monthly collection schedules, and late fines.',
    statusNote: 'Collection efficiency at 96.8% this cycle.',
    detailBullets: [
      'Provide point-of-sale customer installment financing for appliances and goods.',
      'Structure down payments, tenor months, and monthly installment collections.',
      'Generate SMS reminders and automated payment receipt vouchers.',
    ],
    menus: [
      leaf('installments-list', 'List Installments', 'Active retail consumer financing contracts.'),
      leaf('installments-customers', 'Installment Customers', 'Buyer KYC profiles, guarantor details, and income verifications.'),
      leaf('installments-applications', 'Applications', 'Financing evaluation queue awaiting credit check.'),
      leaf('installments-schedules', 'Repayment Schedules', 'Master repayment calendar across all active consumer contracts.'),
    ],
    submodules: [
      { key: 'sms-reminders', label: 'Automated SMS Alerts', enabled: true, description: 'Send automated due-date reminders to buyers.' },
    ],
  },

  // 14. HOTEL & ROOMS
  {
    key: 'rooms',
    label: 'Hotel & Rooms',
    iconKey: 'rooms',
    accent: '#7c3aed',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Occupancy Rate',
    kpiValue: '86%',
    description: 'Room reservations, check-in, check-out, housekeeping status, room pricing tiers, and minibar billing.',
    statusNote: 'Front desk operations synced with housekeeping.',
    detailBullets: [
      'Visual room matrix indicating vacant, occupied, dirty, and maintenance rooms.',
      'Process guest reservations, deposits, express check-in, and check-out.',
      'Consolidate room service, laundry, and minibar charges onto guest folios.',
    ],
    menus: [
      leaf('rooms-matrix', 'Room Status Matrix', 'Live visual floor grid of all rooms and occupancy status.'),
      leaf('rooms-reservations', 'Reservations', 'Advance room bookings and guest deposit records.'),
      leaf('rooms-checkin', 'Check In', 'Guest registration, key assignment, and ID card capture.'),
      leaf('rooms-checkout', 'Check Out', 'Review billing folio, process final tender, and release room.'),
      leaf('room-types', 'Room Types', 'Configure Standard, Deluxe, Suite room tiers and rates.'),
    ],
    submodules: [
      { key: 'hotel-housekeeping', label: 'Housekeeping Sync', enabled: true, description: 'Live status toggle for cleaned / inspected rooms.' },
    ],
  },

  // 15. EXPRESS TICKETS & TRANSPORT
  {
    key: 'tickets',
    label: 'Express Tickets',
    iconKey: 'tickets',
    accent: '#ea580c',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Trips Today',
    kpiValue: '48 Trips',
    description: 'Bus/van passenger ticketing, route schedules, seat reservation charts, and luggage manifests.',
    statusNote: 'All departures departing on published timetables.',
    detailBullets: [
      'Manage routes between cities, transit stations, and departure schedules.',
      'Interactive visual bus seat layout selector for ticket counter agents.',
      'Issue printed QR boarding passes and passenger manifest reports.',
    ],
    menus: [
      leaf('tickets-list', 'List Tickets', 'Issued passenger boarding passes and ticket statuses.'),
      leaf('tickets-booking', 'Book Ticket', 'Interactive seat chart selector for route departures.'),
      leaf('tickets-routes', 'Routes & Destinations', 'Inter-provincial routes, stopovers, and travel distance.'),
      leaf('tickets-schedules', 'Trip Schedules', 'Daily timetable departures, assigned vehicle, and designated driver.'),
      leaf('bus-stations', 'Stations', 'Pickup points, bus terminals, and parcel dropoff counters.'),
    ],
    submodules: [
      { key: 'qr-boarding', label: 'QR Boarding Pass', enabled: true, description: 'Enable conductor mobile ticket scanning.' },
    ],
  },

  // 16. CONCRETES & READY-MIX
  {
    key: 'concretes',
    label: 'Concretes',
    iconKey: 'concretes',
    accent: '#64748b',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Batched Today',
    kpiValue: '380 m³',
    description: 'Ready-mix concrete sales, batching plant orders, mixer truck fleet dispatch, and slump testing.',
    statusNote: 'Batch plant silos fully stocked with aggregate and cement.',
    detailBullets: [
      'Manage ready-mix concrete formulations (200, 250, 300, 350, 400 kg/cm²).',
      'Schedule mixer truck fleet dispatch and monitor pouring pump times.',
      'Record customer site delivery tickets and lab compression test samples.',
    ],
    menus: [
      leaf('concretes-sales', 'Concrete Sales', 'Customer structural concrete supply agreements.'),
      leaf('concretes-deliveries', 'Delivery Schedule', 'Live mixer truck delivery queue and pump allocations.'),
      leaf('concrete-trucks', 'Mixer Trucks', 'Mixer fleet capacities, vehicle condition, and GPS trackers.'),
      leaf('concrete-drivers', 'Drivers', 'Certified commercial mixer drivers and trip logs.'),
      leaf('concrete-plants', 'Batching Plants', 'Silo inventories (Cement, Sand, Gravel, Admixtures).'),
    ],
    submodules: [
      { key: 'concrete-gps', label: 'Fleet Telematics', enabled: true, description: 'Track mixer truck transit and slump times.' },
    ],
  },

  // 17. TRUCKINGS & LOGISTICS
  {
    key: 'truckings',
    label: 'Truckings',
    iconKey: 'truckings',
    accent: '#475569',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Active Freight',
    kpiValue: '19 Loads',
    description: 'Heavy freight orders, container trucking, waybills, fuel expense tracking, and driver allowances.',
    statusNote: 'All cross-border and domestic haulage corridors open.',
    detailBullets: [
      'Schedule long-haul container trucks and flatbed transport orders.',
      'Generate freight waybills, cargo manifests, and customs delivery confirmations.',
      'Track diesel fuel consumption, toll fees, and driver per-diem allowances.',
    ],
    menus: [
      leaf('truckings-orders', 'Trucking Orders', 'Commercial freight shipping bookings and customer waybills.'),
      leaf('trucking-fleet', 'Truck Fleet', 'Tractor units, chassis, container trailers, and maintenance logs.'),
      leaf('trucking-drivers', 'Truck Drivers', 'Heavy vehicle drivers, license validity, and safety records.'),
      leaf('shipping-rates', 'Freight Rates', 'Per-kilometer and route-specific container tariffs.'),
    ],
    submodules: [
      { key: 'fuel-reconciliation', label: 'Fuel Reconcile', enabled: true, description: 'Audit diesel expense against GPS route distances.' },
    ],
  },

  // 18. CUSTOMS CLEARANCES
  {
    key: 'clearances',
    label: 'Clearances',
    iconKey: 'clearances',
    accent: '#0891b2',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Open Declarations',
    kpiValue: '14 Customs',
    description: 'Import/export customs brokerage, HS code tariff filing, clearance permits, and port handling.',
    statusNote: 'Port clearances processing within standard green-lane turnaround.',
    detailBullets: [
      'Prepare Single Administrative Documents (SAD) and customs declaration dossiers.',
      'Manage HS codes, import tariff duties, VAT calculations, and tax exemptions.',
      'Coordinate container releases at dry ports, seaports, and border checkpoints.',
    ],
    menus: [
      leaf('clearance-orders', 'Clearance Orders', 'Active customs brokerage dossiers for import and export shipments.'),
      leaf('clearance-documents', 'Customs Documents', 'Bill of lading, commercial invoices, and packing list archives.'),
      leaf('customs-declarations', 'Declarations', 'Official Single Administrative Document (SAD) filings.'),
      leaf('clearance-ports', 'Ports & Border Gates', 'Port terminals, bonded warehouses, and customs offices.'),
    ],
    submodules: [
      { key: 'tariff-lookup', label: 'HS Code Tariff Engine', enabled: true, description: 'Auto-calculate duty percentages from HS codes.' },
    ],
  },

  // 19. STORE SALES & WHOLESALE
  {
    key: 'store_sales',
    label: 'Store Sales',
    iconKey: 'store_sales',
    accent: '#0284c7',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Wholesale Orders',
    kpiValue: '62 Invoices',
    description: 'Wholesale B2B distribution, distributor store accounts, batch dispatches, and sales declarations.',
    statusNote: 'Wholesale distributor replenishment running normally.',
    detailBullets: [
      'Process bulk B2B commercial store orders with volume pricing tiers.',
      'Coordinate warehouse pallet shipments to wholesale retail chains.',
      'File monthly commercial store sales declarations for regulatory reporting.',
    ],
    menus: [
      leaf('store-sales-list', 'Store Sales', 'Wholesale B2B commercial invoices and distributor orders.'),
      leaf('store-deliveries', 'Store Deliveries', 'Pallet delivery notes and branch replenishment shipments.'),
      leaf('sales-declarations', 'Sales Declarations', 'Regulatory trade sales declarations and monthly filings.'),
    ],
    submodules: [
      { key: 'wholesale-tiering', label: 'Wholesale Price Tiers', enabled: true, description: 'Apply automatic wholesale margin rules.' },
    ],
  },

  // 20. GYM & FITNESS
  {
    key: 'gym',
    label: 'Gym & Fitness',
    iconKey: 'gym',
    accent: '#f97316',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Active Members',
    kpiValue: '480 Athletes',
    description: 'Member access control, fitness packages, personal trainer bookings, class schedules, and turnstile check-in.',
    statusNote: 'Turnstile access controllers operating normally.',
    detailBullets: [
      'Issue RFID membership keycards and track contract validity dates.',
      'Sell gym packages (Monthly, Annual, Day Pass, Personal Training).',
      'Monitor real-time gym capacity and turnstile entry logs.',
    ],
    menus: [
      leaf('gym-members', 'Members', 'Active club members, emergency contacts, and medical waivers.'),
      leaf('gym-packages', 'Membership Packages', 'Day passes, monthly subscriptions, and annual VIP packages.'),
      leaf('gym-checkin', 'Turnstile Check-In', 'Barcode / RFID reader live gate access log.'),
      leaf('gym-classes', 'Fitness Classes', 'Yoga, HIIT, and spinning studio class timetables.'),
      leaf('gym-trainers', 'Trainers', 'Certified fitness coaches and personal training booking slots.'),
    ],
    submodules: [
      { key: 'turnstile-integration', label: 'RFID Turnstile Gate', enabled: true, description: 'Direct TCP/IP gate unlock trigger upon valid scan.' },
    ],
  },

  // 21. SCHOOLS & EDUCATION
  {
    key: 'schools',
    label: 'Schools',
    iconKey: 'schools',
    accent: '#2563eb',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Enrolled Students',
    kpiValue: '1,420 Students',
    description: 'Student admissions, academic programs, grade books, tuition fee billing, examinations, and library.',
    statusNote: 'Mid-term examination grading cycle in progress.',
    detailBullets: [
      'Register student admissions, guardian records, and class enrollment.',
      'Manage academic timetables, subject curriculum, and exam scorecards.',
      'Collect tuition fees, issue receipts, and manage student library circulation.',
    ],
    menus: [
      group('schools-student-info', 'Student Information', 'Student master data and admission records.', [
        leaf('students-list', 'Students', 'Enrolled student roster with guardian contact information.'),
        leaf('student-admissions', 'Admissions', 'New applicant enrollment and entrance registration.'),
      ]),
      group('schools-structure', 'University & College Structure', 'Organizational academic framework.', [
        leaf('schools-colleges', 'Colleges & Faculties', 'Academic faculties, departments, and study majors.'),
        leaf('schools-programs', 'Academic Programs', 'Undergraduate, postgraduate, and diploma degree programs.'),
        leaf('academic-structure', 'Academic Structure', 'Academic years, semesters, credit requirements, and prerequisites.'),
      ]),
      group('schools-academics', 'Academic Management', 'Class scheduling and exams.', [
        leaf('schools-classes', 'Classes & Sections', 'Grade levels, classrooms, and allocated home teachers.'),
        leaf('schools-timetable', 'Timetable', 'Weekly course schedules and lecture hall allocations.'),
        leaf('schools-examinations', 'Examinations', 'Exam schedules, hall tickets, and published grade cards.'),
        leaf('schools-attendances', 'Student Attendance', 'Daily homeroom student attendance records.'),
      ]),
      group('schools-finance', 'Fees & Auxiliary', 'Tuition payments and campus services.', [
        leaf('fees-collection', 'Fees Collection', 'Tuition invoice billing, scholarship discounts, and payment receipts.'),
        leaf('schools-library', 'Library', 'Book catalog, ISBN lookup, and student lending records.'),
        leaf('schools-transport', 'Transport', 'School bus routes, pickup points, and passenger students.'),
        leaf('schools-certificate', 'Certificates', 'Generate verified graduation diplomas and study certificates.'),
      ]),
    ],
    submodules: [
      { key: 'online-grades', label: 'Student Portal Grades', enabled: true, description: 'Publish verified semester grades to student web app.' },
    ],
  },

  // 22. PROJECTS & TASKS
  {
    key: 'projects',
    label: 'Projects',
    iconKey: 'projects',
    accent: '#38bdf8',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Active Projects',
    kpiValue: '12 Projects',
    description: 'Project task management, milestone deadlines, contractor timesheets, and project expense budgeting.',
    statusNote: 'All deliverables on schedule across active projects.',
    detailBullets: [
      'Define project phases, assign tasks to team members, and track completion.',
      'Record employee labor timesheets and billable project hours.',
      'Monitor actual vs budgeted project expenditures and profit margins.',
    ],
    menus: [
      leaf('projects-list', 'Projects', 'Master list of customer and internal enterprise projects.'),
      leaf('project-tasks', 'Project Tasks', 'Action items, priority rankings, assigned owners, and due dates.'),
      leaf('project-milestones', 'Milestones', 'Key delivery phases and client sign-off gates.'),
      leaf('project-timesheets', 'Timesheets', 'Daily logged hours per engineer and billable project rates.'),
    ],
    submodules: [
      { key: 'gantt-chart', label: 'Interactive Gantt Chart', enabled: true, description: 'Visual timeline view of project dependencies.' },
    ],
  },

  // 23. WORK ORDERS & MANUFACTURING
  {
    key: 'workorder',
    label: 'Work Orders',
    iconKey: 'workorder',
    accent: '#6366f1',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Production Queue',
    kpiValue: '8 Orders',
    description: 'Work order routing, Bill of Materials (BOM), manufacturing assembly, raw material staging, and QA inspection.',
    statusNote: 'Production line throughput operating at target efficiency.',
    detailBullets: [
      'Issue shop-floor work orders tied to sales order fulfillment requirements.',
      'Explode Bill of Materials (BOM) to requisition raw material inputs.',
      'Record finished goods output and log material scrap variances.',
    ],
    menus: [
      leaf('workorders-list', 'Work Orders', 'Shop floor production orders and fabrication progress.'),
      leaf('bom-list', 'Bill of Materials (BOM)', 'Product component formulas and manufacturing assembly recipes.'),
      leaf('production-status', 'Production Status', 'Live machine station status, scrap rates, and throughput.'),
    ],
    submodules: [
      { key: 'bom-explosion', label: 'Auto BOM Staging', enabled: true, description: 'Automatically reserve raw inventory when WO is launched.' },
    ],
  },

  // 24. MONEY CHANGE & CURRENCY EXCHANGE
  {
    key: 'money_change',
    label: 'Money Change',
    iconKey: 'money_change',
    accent: '#10b981',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Daily Turnover',
    kpiValue: '$340K',
    description: 'Bureau de change, foreign currency conversion, buy/sell rate spreads, vault positions, and profit/loss.',
    statusNote: 'Forex board rates updated to morning market fixings.',
    detailBullets: [
      'Instant counter currency conversions (USD, KHR, THB, CNY, EUR, VND).',
      'Set dynamic Buy / Sell rate spreads with automatic counter calculations.',
      'Audit physical vault cash drawer positions per foreign currency note.',
    ],
    menus: [
      leaf('money-change-counter', 'Exchange Counter', 'Fast teller window for retail foreign currency exchange.'),
      leaf('exchange-transactions', 'Transactions', 'Historical exchange audit log and customer receipt vouchers.'),
      leaf('exchange-rates', 'Currency Rates', 'Configure live counter Buy and Sell rates per currency pair.'),
      leaf('forex-vault', 'Forex Vault', 'Physical foreign currency cash inventory held across tellers.'),
    ],
    submodules: [
      { key: 'digital-rate-board', label: 'Digital Rate Board', enabled: true, description: 'Broadcast live exchange rates to lobby TV screens.' },
    ],
  },

  // 25. ACCOUNTING & GENERAL LEDGER
  {
    key: 'accounting',
    label: 'Accounting',
    iconKey: 'accounting',
    accent: '#16a34a',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Net Position',
    kpiValue: '$1.48M',
    description: 'Double-entry general ledger, chart of accounts, journal vouchers, balance sheet, and bank reconciliation.',
    statusNote: 'Monthly financial accounts balanced and closed.',
    detailBullets: [
      'Multi-currency chart of accounts supporting standard financial compliance.',
      'Create journal entries with automatic debit and credit balance enforcement.',
      'Generate real-time Balance Sheet, Profit & Loss, Trial Balance, and Cash Book.',
    ],
    menus: [
      group('accounting-gl', 'General Ledger', 'Core double-entry accounting records.', [
        leaf('chart-of-accounts', 'Chart of Accounts', 'Account codes, asset/liability classifications, and parent hierarchies.'),
        leaf('journal-entries', 'Journal Entries', 'Manual adjustments, accrued expenses, and general journal vouchers.'),
        leaf('cash-book', 'Cash Book', 'Daily cash drawer and petty cash register disbursements and receipts.'),
        leaf('bank-reconcile', 'Bank Reconciliation', 'Match bank statement imports with internal ledger deposits and checks.'),
      ]),
      group('accounting-reports', 'Financial Statements', 'Statutory accounting and management reports.', [
        leaf('balance-sheet', 'Balance Sheet', 'Financial position showing company assets, liabilities, and equity.'),
        leaf('profit-loss', 'Profit & Loss', 'Operating income, cost of goods sold, overheads, and net profit.'),
        leaf('trial-balance', 'Trial Balance', 'Audit verification ensuring total debits equal total credits.'),
        leaf('ar-ap-aging', 'AR / AP Aging', 'Outstanding customer receivables and supplier payable aging buckets.'),
      ]),
    ],
    submodules: [
      { key: 'bank-reconcile-toggle', label: 'Bank Reconcile', enabled: true, description: 'Support CSV bank statement reconciliation.' },
      { key: 'cash-accounts', label: 'Cash Accounts', enabled: true, description: 'Separate multi-currency teller and bank accounts.' },
      { key: 'multi-biller', label: 'Multi Biller', enabled: true, description: 'Segregate accounting ledgers per company subsidiary.' },
    ],
  },

  // 26. TAX MANAGEMENT
  {
    key: 'tax',
    label: 'Tax',
    iconKey: 'tax',
    accent: '#dc2626',
    enabled: true,
    health: 'stable',
    kpiLabel: 'VAT Balance',
    kpiValue: '$12.8K',
    description: 'Tax declarations, Value Added Tax (VAT), withholding tax (WHT), salary tax, and GDT compliance.',
    statusNote: 'Current monthly tax return prepared for filing.',
    detailBullets: [
      'Maintain monthly purchase and sales tax ledgers compliant with GDT formats.',
      'Calculate input vs output VAT to determine net tax payable or refund.',
      'Track withholding tax (WHT) deductions on services, rental, and interest.',
    ],
    menus: [
      leaf('tax-declarations', 'Tax Declarations', 'Monthly and annual tax return filings and submission dossiers.'),
      leaf('vat-sales', 'VAT on Sales', 'Output VAT breakdown from official sales tax invoices.'),
      leaf('vat-purchases', 'VAT on Purchases', 'Input VAT recoverable on approved vendor commercial bills.'),
      leaf('withholding-tax', 'Withholding Tax (WHT)', 'Track tax withheld from contractors, rentals, and consultancies.'),
    ],
    submodules: [
      { key: 'gdt-e-filing', label: 'GDT E-Filing Export', enabled: true, description: 'Export monthly tax schedules directly into GDT e-filing templates.' },
    ],
  },

  // 27. HUMAN RESOURCES (HR)
  {
    key: 'hr',
    label: 'HR',
    iconKey: 'hr',
    accent: '#8b5cf6',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Total Workforce',
    kpiValue: '128 Staff',
    description: 'Employee master profiles, department hierarchy, job positions, performance reviews, awards, and warnings.',
    statusNote: 'Workforce records synchronized with biometric devices.',
    detailBullets: [
      'Maintain staff employment records, national IDs, contracts, and emergency contacts.',
      'Configure organizational hierarchy across departments, branches, and positions.',
      'Track salary appraisals, official reprimand warnings, awards, and resignations.',
    ],
    menus: [
      group('hr-recruitment', 'Recruitment', 'Talent acquisition pipeline.', [
        leaf('job-openings', 'Job Openings', 'Published company career vacancies and requirements.'),
        leaf('candidates', 'Candidates', 'Applicant resumes, interview stages, and hiring outcomes.'),
      ]),
      group('hr-staff', 'Employee Governance', 'Workforce master records and records.', [
        leaf('employees', 'Employees', 'Directory of active, probation, and contract staff.', { route: '/admins/users' }),
        leaf('departments', 'Departments', 'Operational divisions and cost centers.'),
        leaf('positions', 'Positions', 'Job titles, grade levels, and compensation bands.'),
        leaf('org-chart', 'Org Chart', 'Visual tree showing reporting structures and line managers.'),
        leaf('promotions', 'Promotions & Transfers', 'Role adjustments, department changes, and salary increments.'),
        leaf('awards-warnings', 'Awards & Warnings', 'Official commendations, merit awards, and disciplinary notices.'),
        leaf('resignations', 'Resignations', 'Staff exit interviews, asset clearances, and final settlements.'),
        leaf('staff-training', 'Training', 'Professional development courses, certifications, and compliance programs.'),
      ]),
    ],
    submodules: [
      { key: 'recruitment-toggle', label: 'Recruitment', enabled: true, description: 'Track talent pipeline from applicant to hire.' },
      { key: 'training-toggle', label: 'Training', enabled: true, description: 'Record employee development certifications.' },
      { key: 'kpi-toggle', label: 'KPI Performance', enabled: true, description: 'Annual performance scorecards.' },
    ],
  },

  // 28. ATTENDANCE & SHIFTS
  {
    key: 'attendance',
    label: 'Attendance',
    iconKey: 'attendance',
    accent: '#06b6d4',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Present Today',
    kpiValue: '96.2%',
    description: 'Biometric timeclock logs, daily check-in/out, leave requests, day off rosters, and overtime approvals.',
    statusNote: 'Fingerprint and facial scanners syncing in real time.',
    detailBullets: [
      'Ingest real-time clock-in/out records from fingerprint and facial terminals.',
      'Process employee annual leave, sick leave, and maternity leave applications.',
      'Approve overtime hours and feed verified timesheets into payroll.',
    ],
    menus: [
      leaf('attendance-list', 'Attendances', 'Daily attendance logs showing arrival times, departures, and lateness.'),
      leaf('check-in-out', 'Check In / Out', 'Manual counter or web portal clock-in punch interface.'),
      leaf('take-leaves', 'Take Leaves', 'Employee leave applications, approvals, and balance quotas.'),
      leaf('day-off', 'Day Off & Holidays', 'Official public holidays and scheduled staff weekly rest days.'),
      leaf('approve-attendances', 'Approve Attendances', 'Manager sign-off on monthly working hours before payroll.'),
      leaf('overtime', 'Overtime (OT)', 'Pre-approved overtime requests and premium rate calculations.'),
      leaf('attendance-devices', 'Devices', 'Configure ZKTeco and IP biometric attendance terminals.'),
    ],
    submodules: [
      { key: 'device-sync', label: 'Biometric Scanner Sync', enabled: true, description: 'Auto-pull punches from network biometric terminals.' },
    ],
  },

  // 29. PAYROLL
  {
    key: 'payroll',
    label: 'Payroll',
    iconKey: 'payroll',
    accent: '#059669',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Monthly Payroll',
    kpiValue: '$94.2K',
    description: 'Automated salary calculations, cash advances, benefits, allowances, tax deductions, and printed payslips.',
    statusNote: 'Current monthly payroll batch prepared for disbursement.',
    detailBullets: [
      'Calculate gross salary, overtime premiums, allowances, and statutory deductions.',
      'Manage mid-month cash advances and amortized salary deductions.',
      'Generate professional printed payslips and bank ABA/Wing transfer batch files.',
    ],
    menus: [
      leaf('cash-advances', 'Cash Advances', 'Employee salary advances and monthly repayment deductions.'),
      leaf('employee-benefits', 'Benefits & Allowances', 'Housing, transport, food allowances, and seniority pay.'),
      leaf('pre-salaries', 'Pre-Salaries', 'Draft salary calculations awaiting HR and director verification.'),
      leaf('salaries-list', 'Salaries', 'Finalized monthly payroll register across all company departments.'),
      leaf('thirteenth-salary', '13th Month Salary', 'Annual bonus and statutory seniority indemnity calculations.'),
      leaf('payroll-payments', 'Payments', 'Record bank disbursement batches and cash salary envelopes.'),
      leaf('payslips', 'Payslips', 'Generate and print individual employee payslips with detailed earnings.'),
    ],
    submodules: [
      { key: 'cash-advance-toggle', label: 'Cash Advance', enabled: true, description: 'Support emergency salary advance requests.' },
      { key: 'benefit-reporting-toggle', label: 'Benefit Reporting', enabled: true, description: 'Itemize allowances for NSSF and tax compliance.' },
    ],
  },

  // 30. REPAIRS & WORKSHOP
  {
    key: 'repairs',
    label: 'Repairs',
    iconKey: 'repairs',
    accent: '#e11d48',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Workshop Jobs',
    kpiValue: '23 In Progress',
    description: 'Service repair tickets, technician assignment, spare parts usage, warranty tracking, and job status.',
    statusNote: 'Average turnaround time currently 1.8 days.',
    detailBullets: [
      'Accept customer repair equipment and generate tracked service intake tickets.',
      'Assign workshop technicians, diagnose defects, and log replacement parts.',
      'Notify customer upon repair completion and issue warranty invoices.',
    ],
    menus: [
      leaf('repairs-list', 'Repair Orders', 'Active workshop service tickets and job statuses.'),
      leaf('add-repair', 'Add Repair Order', 'Intake customer device or machinery for inspection.'),
      leaf('repair-technicians', 'Technicians', 'Assigned service engineers and workload capacity.'),
      leaf('repair-warranty', 'Warranty Status', 'Check manufacturer and shop warranty eligibility on repair items.'),
    ],
    submodules: [
      { key: 'sms-repair-notify', label: 'SMS Customer Alerts', enabled: true, description: 'Notify clients via SMS when repairs are ready for collection.' },
    ],
  },

  // 31. EXPENSES & BUDGETING
  {
    key: 'expenses',
    label: 'Expenses',
    iconKey: 'expenses',
    accent: '#ef4444',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Monthly Spend',
    kpiValue: '$14.6K',
    description: 'Operating expenses, petty cash vouchers, expense categories, approval workflows, and departmental budgets.',
    statusNote: 'All departmental expenditures within allocated monthly caps.',
    detailBullets: [
      'Record operating costs, utilities, travel, office supplies, and meals.',
      'Attach digital receipts and supplier bills to expense vouchers.',
      'Compare actual departmental expenses against annual budget ceilings.',
    ],
    menus: [
      leaf('expenses-list', 'List Expenses', 'Review all logged operating expenses and approval states.', { route: '/admins?module=expenses&menu=expenses-list' }),
      leaf('add-expense', 'Add Expense', 'Submit new expense voucher with category and receipt upload.'),
      leaf('expense-categories', 'Expense Categories', 'Classify expenses (Rent, Utilities, Travel, Supplies, Marketing).'),
      leaf('expense-budgets', 'Budgets', 'Set and monitor monthly expenditure caps per department.'),
    ],
    submodules: [
      { key: 'expense-approval', label: 'Manager Sign-Off', enabled: true, description: 'Enforce dual approval on expenses exceeding $500.' },
    ],
  },

  // 32. CALENDAR & EVENTS
  {
    key: 'calendar',
    label: 'Calendar',
    iconKey: 'calendar',
    accent: '#3b82f6',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Upcoming Events',
    kpiValue: '6 Events',
    description: 'Corporate calendar, maintenance schedules, delivery appointments, company holidays, and task deadlines.',
    statusNote: 'Enterprise calendar synchronized across teams.',
    detailBullets: [
      'View company-wide deadlines, client visits, and scheduled deliveries on a master calendar.',
      'Color-code events by department (Operations, Sales, HR, Management).',
      'Synchronize reminders and high-priority milestone alerts.',
    ],
    menus: [
      leaf('calendar-view', 'Corporate Calendar', 'Full interactive month, week, and day event scheduling view.'),
      leaf('calendar-events', 'Event List', 'Browse upcoming corporate appointments and scheduled reviews.'),
    ],
    submodules: [
      { key: 'calendar-sync', label: 'External Calendar Sync', enabled: true, description: 'Export iCal feeds to Google Calendar and Outlook.' },
    ],
  },

  // 33. PEOPLE (Users, Billers, Customers, Suppliers)
  {
    key: 'people',
    label: 'People',
    iconKey: 'people',
    accent: '#6366f1',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Total Contacts',
    kpiValue: '3,840 Contacts',
    description: 'Master directory of customers, suppliers, billers, and staff users with access permissions.',
    statusNote: 'Customer and supplier profiles verified and clean.',
    detailBullets: [
      'Maintain CRM customer profiles, credit terms, and transaction histories.',
      'Track suppliers, payment terms, and vendor performance ratings.',
      'Manage administrative user accounts, roles, and branch assignments.',
    ],
    menus: [
      leaf('users-list', 'Users & Roles', 'Administrative staff logins, roles, and permission levels.', { route: '/admins/users' }),
      leaf('billers-list', 'Billers / Stores', 'Company corporate entities, registered branches, and tax IDs.', { route: '/admins/branches' }),
      leaf('customers-list', 'Customers', 'Client accounts, pricing tiers, and credit limit settings.', { route: '/admins/customers' }),
      leaf('suppliers-list', 'Suppliers', 'Vendor contact directory, payment terms, and bank details.'),
      leaf('customer-groups', 'Customer Groups', 'Segment buyers into Wholesale, Retail, Corporate, and VIP tiers.'),
    ],
    submodules: [
      { key: 'credit-limit-enforce', label: 'Credit Limit Lock', enabled: true, description: 'Prevent new sales to customers with overdue balances.' },
    ],
  },

  // 34. COMPANIES & BRANCHES
  {
    key: 'companies',
    label: 'Companies',
    iconKey: 'companies',
    accent: '#475569',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Active Branches',
    kpiValue: '21 Branches',
    description: 'Multi-store billers, physical branch locations, tax registration details, and warehouse assignments.',
    statusNote: 'All company branch entities operating and configured.',
    detailBullets: [
      'Manage multiple registered business entities under a single unified ERP instance.',
      'Assign distinct warehouses, price lists, and letterheads per branch.',
      'Control user access so employees only see their assigned branch records.',
    ],
    menus: [
      leaf('companies-list', 'Companies List', 'Registered corporate holding entities and subsidiary stores.', { route: '/admins/branches' }),
      leaf('branches-list', 'Branches', 'Physical store locations, addresses, phone numbers, and managers.', { route: '/admins/branches' }),
      leaf('warehouses-list', 'Warehouses', 'Storage facilities, distribution hubs, and bin locations.', { route: '/admins/products?tab=warehouses' }),
    ],
    submodules: [
      { key: 'branch-isolation', label: 'Data Isolation', enabled: true, description: 'Isolate reports and records strictly by branch ID.' },
    ],
  },

  // 35. SYSTEM SETTINGS
  {
    key: 'settings',
    label: 'Settings',
    iconKey: 'settings',
    accent: '#64748b',
    enabled: true,
    health: 'stable',
    kpiLabel: 'System Status',
    kpiValue: 'Optimal',
    description: 'System settings, POS options, categories, units, brands, currencies, security, backups, and API keys.',
    statusNote: 'Database backups and system integrity tests passing.',
    detailBullets: [
      'Configure global ERP settings, corporate branding, logos, and receipt templates.',
      'Manage item categories, subcategories, units of measure, brands, and variants.',
      'Control user permission matrices, audit trail logs, Telegram bot hooks, and API keys.',
    ],
    menus: [
      group('settings-general', 'General Settings', 'Core enterprise parameters.', [
        leaf('system-settings', 'System Settings', 'Company name, timezone, default currency, and system behaviors.', { route: '/admins?module=settings&menu=system-settings' }),
        leaf('change-logo', 'Branding & Logo', 'Upload enterprise logos for website, invoices, and POS receipts.'),
        leaf('currencies', 'Currencies', 'Configure base currency and secondary exchange rates (USD, KHR, THB).'),
        leaf('tax-rates', 'Tax Rates', 'Define VAT, GST, and service charge rates applied to orders.'),
      ]),
      group('settings-catalog-data', 'Catalog Master Data', 'Product classification taxonomy.', [
        leaf('categories', 'Categories', 'Hierarchical category tree and subcategories for products.', { route: '/admins/settings/categories' }),
        leaf('brands', 'Brands', 'Catalog manufacturer brands, logos, and supplier links.'),
        leaf('units', 'Units', 'Units of measurement (Piece, Box, Carton, Kilogram, Liter).'),
        leaf('variants', 'Variants & Attributes', 'Size, color, specification, and flavor option matrices.'),
        leaf('warehouses', 'Warehouses', 'Manage physical storage depots and rack configurations.'),
      ]),
      group('settings-security', 'Security & Administration', 'Permissions, backups, and telemetry.', [
        leaf('user-permissions', 'Permissions Matrix', 'Role-based access control (RBAC) across all 39 modules.', { route: '/admins/settings/permissions' }),
        leaf('user-groups', 'User Groups & Roles', 'Manage Owner, Admin, Cashier, Warehouse, and Accountant roles.', { route: '/admins/settings/roles' }),
        leaf('audit-trail', 'Audit Trail', 'Full chronological telemetry log of all admin operations and edits.', { route: '/admins/settings/access' }),
        leaf('backups', 'Backups', 'Create and download full database SQL dumps and asset archives.'),
        leaf('api-keys', 'API Keys', 'Issue secure API bearer tokens for external integrations and webhooks.'),
        leaf('telegrams', 'Telegram Bots', 'Configure automated order notifications and Telegram Mini App bots.'),
      ]),
    ],
    submodules: [
      { key: 'multi-level', label: 'Multi Level Categories', enabled: true, description: 'Support nested subcategory trees.' },
      { key: 'multi-biller-toggle', label: 'Multi Biller', enabled: true, description: 'Support multiple registered business entities.' },
      { key: 'api-keys-toggle', label: 'API Keys', enabled: true, description: 'Expose REST API endpoints to external applications.' },
    ],
  },

  // 36. COMPREHENSIVE REPORTS
  {
    key: 'reports',
    label: 'Reports',
    iconKey: 'reports',
    accent: '#0284c7',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Analytical Reports',
    kpiValue: '32 Reports',
    description: 'Complete cross-module analytics for inventory, sales, purchases, HR, payroll, loans, and accounting.',
    statusNote: 'All analytical data warehouses indexed and current.',
    detailBullets: [
      'Examine stock valuation, movement velocity, and low-stock replenishment reports.',
      'Analyze sales trends, profitability by product/store, and customer loyalty metrics.',
      'Audit financial ledgers, accounts receivable/payable aging, and tax declarations.',
    ],
    menus: [
      group('reports-inventory', 'Inventory Reports', 'Stock valuations and movements.', [
        leaf('report-stock-value', 'Stock Value & Cost', 'Current inventory valuation at cost and retail selling prices.', { route: '/admins/reports/inventory' }),
        leaf('report-product-quantity', 'Product Quantity Alerts', 'Items below alert threshold requiring purchase replenishment.'),
        leaf('report-warehouse-stock', 'Warehouse Stock', 'Stock distribution across all physical company depots.'),
        leaf('report-adjustments', 'Adjustments Report', 'Audit log of all inventory additions and write-offs.'),
      ]),
      group('reports-sales', 'Sales Reports', 'Commercial sales and profit metrics.', [
        leaf('report-sales-overview', 'Sales Report', 'Historical revenue, invoice counts, and payment methods.', { route: '/admins/reports/sales' }),
        leaf('report-daily-sales', 'Daily Sales', 'Day-by-day sales breakdown with tax and discount totals.'),
        leaf('report-monthly-sales', 'Monthly Sales', 'Yearly trends and month-over-month performance growth.'),
        leaf('report-product-sales', 'Product Sales', 'Best-selling items by revenue, volume, and gross margin.'),
        leaf('report-payments', 'Payments Report', 'Cash, bank transfer, and card payment collections.'),
      ]),
      group('reports-procurement', 'Purchases Reports', 'Vendor spend and fulfillment.', [
        leaf('report-purchases', 'Purchases Report', 'Vendor spend analysis, payment terms, and outstanding balances.'),
        leaf('report-daily-purchases', 'Daily Purchases', 'Daily receiving receipts and inventory intake values.'),
      ]),
      group('reports-finance-hr', 'Finance & People Reports', 'Ledger, loans, and HR analytics.', [
        leaf('report-customers', 'Customer Reports', 'Customer lifetime spend, purchase frequency, and credit health.'),
        leaf('report-suppliers', 'Supplier Reports', 'Vendor delivery reliability and total annual expenditure.'),
        leaf('report-hr', 'HR & Attendance Report', 'Employee attendance rates, tardiness, and leave utilization.'),
        leaf('report-payroll', 'Payroll Report', 'Historical salary disbursements, taxes, and benefit expenses.'),
        leaf('report-loans', 'Loans Report', 'Credit portfolio health, earned interest, and default rates.'),
        leaf('report-accounts', 'Financial Statements Report', 'Comprehensive balance sheet and P&L export packs.'),
      ]),
    ],
    submodules: [
      { key: 'inventory-pack', label: 'Inventory Pack', enabled: true, description: 'Deep-dive stock turnover and aging analytics.' },
      { key: 'sales-pack', label: 'Sales Pack', enabled: true, description: 'Segment profitability by channel and customer.' },
      { key: 'finance-pack', label: 'Finance Pack', enabled: true, description: 'Automated executive financial summary exports.' },
    ],
  },

  // 37. FRONT END & STORE CONTROL
  {
    key: 'front-end',
    label: 'Front End',
    iconKey: 'front-end',
    accent: '#06b6d4',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Customer Channels',
    kpiValue: '3 Channels',
    description: 'Public storefront settings, store banners, e-menu customization, and Telegram Mini App controls.',
    statusNote: 'Web catalog, Telegram Mini App, and mobile web synced.',
    detailBullets: [
      'Control public website display, featured store products, and hero carousel banners.',
      'Configure mobile Telegram Mini App (TMA) branding and menu navigation.',
      'Manage multi-branch store listings and public contact parameters.',
    ],
    menus: [
      leaf('shop-control', 'Stores Controller', 'Assign products, categories, and branding per public retail store.', { route: '/admins/frontend' }),
      leaf('store-products', 'Store Products', 'Filter and publish catalog items to the public website and app.'),
      leaf('website-display', 'Website Display', 'Configure public homepage layout, featured sections, and badges.'),
      leaf('slider-settings', 'Slider & Banners', 'Manage promotional hero banners, discount badges, and links.'),
      leaf('list-pages', 'Custom Pages', 'Create informational pages (About Us, Terms, FAQs, Shipping Policy).'),
      leaf('shop-settings', 'Shop Settings', 'Online ordering policies, minimum order amounts, and operating hours.'),
    ],
    submodules: [
      { key: 'frontend-stores-toggle', label: 'Stores Controller', enabled: true, description: 'Segment public stores by biller ID.' },
      { key: 'frontend-products-toggle', label: 'Store Products', enabled: true, description: 'Curate products visible in the public store.' },
      { key: 'frontend-slider-toggle', label: 'Slider & Banners', enabled: true, description: 'Promotional marketing banner carousel.' },
    ],
  },

  // 37b. E-COMMERCE & MULTI-PURPOSE WEBSITE
  {
    key: 'ecommerce',
    label: 'E-commerce & Website',
    iconKey: 'portal',
    accent: '#2563eb',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Active Website Template',
    kpiValue: 'E-commerce',
    description: 'Master toggle for public website visibility, shopping storefront, and extensible multi-service website templates.',
    statusNote: 'Connected directly to public website storefront visibility and template engine.',
    detailBullets: [
      'Master On/Off switch controls public website availability (Maintenance mode when OFF).',
      'Selectable sub-modules for Default E-commerce, Education Website, Company Profile, and Booking.',
      'Full catalog sync, Telegram Mini App ordering, and multi-service template switching.'
    ],
    menus: [
      leaf('website-home', 'View Public Website', 'Open the live customer-facing website storefront.', { route: '/' }),
      leaf('template-settings', 'Website Templates', 'Configure active sub-website template and appearance.', { route: '/admins/settings/modules' }),
      leaf('storefront-controls', 'Storefront Control', 'Featured products, hero banners, and retail store settings.', { route: '/admins/frontend' })
    ],
    submodules: [
      { key: 'ecommerce-default', label: 'Default E-commerce', enabled: true, description: 'Base retail store with product catalog, cart, and checkout.' },
      { key: 'ecommerce-education', label: 'Education Website', enabled: true, description: 'Interactive courses, academy LMS portal, and admissions.' },
      { key: 'ecommerce-company', label: 'Company Profile', enabled: true, description: 'Corporate showcase, enterprise solutions, and portfolio.' },
      { key: 'ecommerce-booking', label: 'Service / Booking Website', enabled: true, description: 'Service consultation menu, appointments, and booking engine.' }
    ]
  },

  // 38. WEBSITE CMS
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
      leaf('cms-qrcode', 'QR Code Generator', 'Generate and download printable table and counter QR codes for stores.', { route: '/admins/qrcode' }),
      leaf('cms-settings', 'Website Settings', 'Global branding, logo, contact, footer, and SEO configuration.', { route: '/admins?module=data&section=settings' }),
    ],
    submodules: [
      { key: 'cms-bilingual', label: 'Khmer Bilingual Support', enabled: true, description: 'Allows dual-language content editing.' },
      { key: 'cms-mysql', label: 'Local MySQL Sync', enabled: true, description: 'Synchronize directly to database tables.' },
    ],
  },

  // 39. CLINIC & HEALTHCARE
  {
    key: 'clinic',
    label: 'Clinic',
    iconKey: 'clinic',
    accent: '#ef5b5b',
    enabled: true,
    health: 'stable',
    kpiLabel: 'Patients Today',
    kpiValue: '184',
    description: 'Patient records, consultations, OPD, IPD, clinical prescriptions, pharmacy, and bed management.',
    statusNote: 'Clinical queue and pharmacy dispensing synchronized.',
    detailBullets: [
      'Register patients and route them into doctor consultation, OPD, and IPD queues.',
      'Record progress notes, surgical operations, pathology, and medication dosages.',
      'Manage hospital bed occupancy, vital signs, and clinical invoice billing.',
    ],
    menus: [
      leaf('patients', 'List Patient', 'Review patient records and registration details.', { route: '/admins?module=clinic&menu=patients' }),
      leaf('consultation', 'Consultation', 'Manage doctor consultation and diagnosis outcomes.'),
      leaf('opd', 'OPD', 'Track outpatient treatments and discharge-ready visits.'),
      group('clinic-ipd', 'IPD', 'Inpatient admission, ward treatment, and medical notes.', [
        leaf('ipd-patient', 'IPD Patient', 'See admitted ward patients and treatment status.'),
        leaf('progress-note', 'Progress Note', 'Maintain ongoing clinical observations.'),
        leaf('medication-dose', 'Medication Dose', 'Control medication schedules and dosing changes.'),
        leaf('operations', 'Operations', 'Prepare and track surgical procedure records.'),
        leaf('pathology', 'Pathology', 'Monitor pathology lab requests and test results.'),
      ]),
      group('clinic-sales', 'Sales & Invoices', 'Clinical prescriptions and billing.', [
        leaf('prescription', 'Prescription', 'Issue and review doctor medicine prescriptions.'),
        leaf('clinic-invoices', 'Invoice', 'Track clinic sales invoices and treatment payment status.'),
      ]),
      group('clinic-pharmacy', 'Pharmacy', 'Medicine master data and issue flow.', [
        leaf('medicines', 'Medicines', 'Browse stocked pharmaceuticals and dosage forms.'),
        leaf('add-medicine', 'Add Medicine', 'Register a new medicine into pharmacy master data.'),
      ]),
      group('clinic-bed', 'Bed & Wards', 'Bed list and patient room allocation.', [
        leaf('bed-list', 'Beds', 'Track bed occupancy and room readiness.'),
        leaf('bed-assign', 'Assign Bed', 'Assign or transfer inpatient hospital beds.'),
      ]),
    ],
    submodules: [
      { key: 'ipd', label: 'IPD', enabled: true, description: 'Enable inpatient treatment workflows.' },
      { key: 'pharmacy-toggle', label: 'Pharmacy', enabled: true, description: 'Enable medicine stock and issue flows.' },
      { key: 'beds', label: 'Beds', enabled: true, description: 'Enable room and bed allocation features.' },
    ],
  },
];

const visitMenuTree = (items = [], callback, path = []) => {
  for (const item of items) {
    const nextPath = [...path, item];
    callback(item, nextPath);
    if (item.children?.length) {
      visitMenuTree(item.children, callback, nextPath);
    }
  }
};

const findMenuPath = (items = [], targetKey, path = []) => {
  const normalizedKey = targetKey === 'pos-sales' || targetKey === 'list-pos' || targetKey === 'list_POS' ? 'list_pos' : targetKey;
  for (const item of items) {
    const nextPath = [...path, item];
    if (item.key === targetKey || item.key === normalizedKey) {
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
  const flattened = flattenMenuItems(module?.menus || []);
  const normalizedKey = menuKey === 'pos-sales' || menuKey === 'list-pos' || menuKey === 'list_POS' ? 'list_pos' : menuKey;

  return flattened.find((item) => item.key === menuKey || item.key === normalizedKey) || flattened[0];
};

export const getMenuLineage = (moduleKey, menuKey) => {
  const module = getModuleByKey(moduleKey);
  if (!module) return [];
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

export const moduleHealthLabel = {
  stable: 'Healthy & Operational',
  watch: 'Attention Recommended',
  paused: 'Deactivated / Paused',
};

