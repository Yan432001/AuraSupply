const db = require("../../config/utill/connection");
const { logError } = require("../../config/utill/logErr");

/**
 * GET /api/admin/dashboard/stats
 * Real aggregated telemetry and metrics from MySQL aura_v1_db
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Sales & Revenue
    const [salesStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_sales,
        COALESCE(SUM(grand_total), 0) AS total_revenue,
        COALESCE(SUM(paid), 0) AS total_paid,
        SUM(CASE WHEN sale_status IN ('completed', 'delivered', 'paid') THEN 1 ELSE 0 END) AS completed_sales,
        SUM(CASE WHEN sale_status IN ('pending', '', NULL) THEN 1 ELSE 0 END) AS pending_sales
      FROM aura_sales
    `);

    // 2. Inventory & Products
    const [productStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_products,
        COALESCE(SUM(quantity), 0) AS total_stock_units,
        COALESCE(SUM(price * quantity), 0) AS total_inventory_value,
        SUM(CASE WHEN quantity > 0 AND quantity <= COALESCE(alert_quantity, 5) THEN 1 ELSE 0 END) AS low_stock_count,
        SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END) AS out_of_stock_count
      FROM aura_products
    `);

    // 3. Customers & Suppliers
    const [companyStats] = await db.query(`
      SELECT 
        SUM(CASE WHEN group_name = 'customer' THEN 1 ELSE 0 END) AS total_customers,
        SUM(CASE WHEN group_name = 'supplier' THEN 1 ELSE 0 END) AS total_suppliers
      FROM aura_companies
    `);

    // 4. Purchases
    const [purchaseStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_purchases,
        COALESCE(SUM(grand_total), 0) AS total_purchase_spend
      FROM aura_purchases
    `);

    // 5. Users
    const [userStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_users,
        SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_users
      FROM aura_users
    `);

    // 6. Recent 10 Orders
    const [recentOrders] = await db.query(`
      SELECT 
        id, reference_no, date, customer, biller, grand_total, sale_status, payment_status
      FROM aura_sales
      ORDER BY id DESC
      LIMIT 10
    `);

    // 7. Monthly Sales Trend (Last 6 Months)
    const [monthlyTrend] = await db.query(`
      SELECT 
        DATE_FORMAT(date, '%b %Y') AS month_label,
        COUNT(id) AS orders_count,
        COALESCE(SUM(grand_total), 0) AS revenue
      FROM aura_sales
      WHERE date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(date, '%b %Y'), YEAR(date), MONTH(date)
      ORDER BY YEAR(date) ASC, MONTH(date) ASC
    `);

    // 8. Top 5 Selling Products
    const [topProducts] = await db.query(`
      SELECT 
        product_name,
        SUM(quantity) AS total_quantity,
        SUM(subtotal) AS total_revenue
      FROM aura_sale_items
      GROUP BY product_id, product_name
      ORDER BY total_revenue DESC
      LIMIT 5
    `);

    const s = salesStats[0] || {};
    const p = productStats[0] || {};
    const c = companyStats[0] || {};
    const pur = purchaseStats[0] || {};
    const u = userStats[0] || {};

    res.json({
      status: true,
      stats: {
        totalRevenue: parseFloat(s.total_revenue) || 0,
        totalSales: parseInt(s.total_sales) || 0,
        completedSales: parseInt(s.completed_sales) || 0,
        pendingSales: parseInt(s.pending_sales) || 0,
        totalProducts: parseInt(p.total_products) || 0,
        totalStockUnits: parseFloat(p.total_stock_units) || 0,
        inventoryValue: parseFloat(p.total_inventory_value) || 0,
        lowStockCount: parseInt(p.low_stock_count) || 0,
        outOfStockCount: parseInt(p.out_of_stock_count) || 0,
        totalCustomers: parseInt(c.total_customers) || 0,
        totalSuppliers: parseInt(c.total_suppliers) || 0,
        totalPurchases: parseInt(pur.total_purchases) || 0,
        totalPurchaseSpend: parseFloat(pur.total_purchase_spend) || 0,
        totalUsers: parseInt(u.total_users) || 0,
        activeUsers: parseInt(u.active_users) || 0
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        referenceNo: o.reference_no,
        date: o.date,
        customer: o.customer || 'General Customer',
        biller: o.biller || 'Aura Supply HQ',
        amount: parseFloat(o.grand_total) || 0,
        status: o.sale_status || 'pending',
        paymentStatus: o.payment_status || 'due'
      })),
      monthlyTrend,
      topProducts: topProducts.map(tp => ({
        name: tp.product_name,
        quantity: parseFloat(tp.total_quantity) || 0,
        revenue: parseFloat(tp.total_revenue) || 0
      }))
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    logError("dashboard.controller.getDashboardStats", err, res);
  }
};
