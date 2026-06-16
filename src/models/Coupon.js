import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true, min: 0 },
    minPurchase: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // cap for percentage type, 0 = no cap
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function (subtotal) {
  if (!this.isActive) return 'Coupon is inactive';
  if (this.expiresAt && this.expiresAt < Date.now()) return 'Coupon has expired';
  if (this.usageLimit && this.usedCount >= this.usageLimit) return 'Coupon usage limit reached';
  if (subtotal < this.minPurchase) return `Minimum purchase of $${this.minPurchase} required`;
  return null; // valid
};

couponSchema.methods.computeDiscount = function (subtotal) {
  let discount =
    this.discountType === 'percentage' ? (subtotal * this.discountValue) / 100 : this.discountValue;
  if (this.maxDiscount > 0) discount = Math.min(discount, this.maxDiscount);
  return Math.min(discount, subtotal);
};

export default mongoose.model('Coupon', couponSchema);
