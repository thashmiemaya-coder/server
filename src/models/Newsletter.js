import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    isSubscribed: { type: Boolean, default: true },
    unsubscribeToken: String,
  },
  { timestamps: true }
);

export default mongoose.model('Newsletter', newsletterSchema);
