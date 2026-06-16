import mongoose from 'mongoose';
import Book from './Book.js';

const reviewSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One review per user per book
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

// Recalculate book ratings after save/remove
reviewSchema.statics.recalcRatings = async function (bookId) {
  const stats = await this.aggregate([
    { $match: { book: bookId, isApproved: true } },
    { $group: { _id: '$book', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await Book.findByIdAndUpdate(bookId, {
    ratings: Math.round(avg * 10) / 10,
    numReviews: count,
  });
};

reviewSchema.post('save', function () {
  this.constructor.recalcRatings(this.book);
});
reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) doc.constructor.recalcRatings(doc.book);
});

export default mongoose.model('Review', reviewSchema);
