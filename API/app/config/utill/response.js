/**
 * Standard API Response Formatter for Aura ERP
 * Schema: { success: Boolean, message: String, data: Any, errors: Array|Object|null, pagination: Object|null }
 */

const sendSuccess = (res, data = null, message = 'Operation successful', pagination = null, statusCode = 200) => {
  const payload = {
    success: true,
    message,
    data,
    errors: null
  };
  if (pagination) {
    payload.pagination = pagination;
  }
  return res.status(statusCode).json(payload);
};

const sendError = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: errors ? (Array.isArray(errors) ? errors : [errors]) : null
  });
};

const sendPaginated = (res, data, total, page, limit, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit) || 1;
  return res.status(200).json({
    success: true,
    message,
    data,
    errors: null,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated
};
