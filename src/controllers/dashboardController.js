import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import Review from '../models/Review.js';

// @route GET /api/v1/dashboard/stats  (admin)
export const getStats = asyncHandler(async (_req, res) => {
  const [totalOrders, totalBooks, totalUsers, totalReviews] = await Promise.all([
    Order.countDocuments(),
    Book.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Review.countDocuments(),
  ]);

  const revenueAgg = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  const lowStock = await Book.find({ stock: { $lte: 5 }, isActive: true })
    .select('title stock')
    .limit(10);

  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(8);

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    stats: { totalOrders, totalBooks, totalUsers, totalReviews, totalRevenue },
    lowStock,
    recentOrders,
    ordersByStatus,
  });
});

// @route GET /api/v1/dashboard/sales?range=monthly  (admin)
export const getSalesReport = asyncHandler(async (req, res) => {
  const range = req.query.range || 'monthly';
  const fmt = range === 'daily' ? '%Y-%m-%d' : range === 'yearly' ? '%Y' : '%Y-%m';

  const sales = await Order.aggregate([
    { $match: { isPaid: true } },
    {
      $group: {
        _id: { $dateToString: { format: fmt, date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  const topBooks = await Book.find().sort('-sold').limit(5).select('title author sold price');

  const topCategories = await Order.aggregate([
    { $match: { isPaid: true } },
    { $unwind: '$orderItems' },
    {
      $lookup: { from: 'books', localField: 'orderItems.book', foreignField: '_id', as: 'book' },
    },
    { $unwind: '$book' },
    {
      $group: {
        _id: '$book.category',
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        units: { $sum: '$orderItems.quantity' },
      },
    },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { name: '$category.name', revenue: 1, units: 1 } },
    { $sort: { revenue: -1 } },
  ]);

  res.json({ success: true, range, sales, topBooks, topCategories });
});
