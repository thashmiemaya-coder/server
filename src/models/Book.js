import mongoose from 'mongoose';
import slugify from 'slugify';

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    slug: { type: String, unique: true, index: true },
    author: { type: String, required: [true, 'Author is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    isbn: { type: String, trim: true },
    publisher: String,
    language: { type: String, default: 'English' },
    pages: Number,
    publishedYear: Number,

    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    discountPrice: { type: Number, min: 0, default: 0 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [String],

    images: [{ public_id: String, url: String }],
    coverImage: { type: String, default: '' },

    stock: { type: Number, required: true, default: 0, min: 0 },
    sold: { type: Number, default: 0 },

    ratings: { type: Number, default: 0 }, // average
    numReviews: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bookSchema.index({ title: 'text', author: 'text', description: 'text' });

bookSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${Date.now().toString(36)}`;
  }
  next();
});

// Virtual: effective selling price
bookSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

export default mongoose.model('Book', bookSchema);
