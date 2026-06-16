import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Book from '../models/Book.js';
import Coupon from '../models/Coupon.js';

const categories = [
  { name: 'Fiction', description: 'Imaginative storytelling and novels' },
  { name: 'Fantasy', description: 'Magic, myth and epic worlds' },
  { name: 'Romance', description: 'Love stories and contemporary romance' },
  { name: 'Poetry', description: 'Verse, anthologies and collections' },
  { name: 'Mystery & Thriller', description: 'Suspense and crime' },
  { name: 'Non-Fiction', description: 'History, science and essays' },
];

// Mirrors the books shown in the BookHaven design mock.
const booksSeed = (catMap, adminId) => [
  {
    title: 'The Melody Muse', author: 'Mia Harper', category: catMap['Fiction'],
    price: 16.99, ratings: 4.8, numReviews: 124, stock: 40, isFeatured: true, isBestSeller: true,
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    description: 'A lyrical novel about a young musician discovering her voice among the shelves of an old city library.',
    publishedYear: 2024, pages: 312, language: 'English', createdBy: adminId,
  },
  {
    title: 'The Midnight Library', author: 'Matt Haig', category: catMap['Fiction'],
    price: 14.99, ratings: 4.9, numReviews: 980, stock: 60, isFeatured: true, isBestSeller: true,
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
    description: 'Between life and death there is a library, and within it, infinite books offering the chance to try another life.',
    publishedYear: 2020, pages: 304, language: 'English', createdBy: adminId,
  },
  {
    title: 'A Short History of English Poetry', author: 'James Reeves', category: catMap['Poetry'],
    price: 12.99, ratings: 4.7, numReviews: 56, stock: 25, isFeatured: true,
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    description: 'A concise and elegant survey of English verse from Chaucer to the modern age.',
    publishedYear: 2023, pages: 280, language: 'English', createdBy: adminId,
  },
  {
    title: 'The Shadow of the Wind', author: 'Carlos Ruiz Zafón', category: catMap['Mystery & Thriller'],
    price: 13.99, ratings: 4.8, numReviews: 410, stock: 33, isBestSeller: true,
    coverImage: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=400',
    description: 'In post-war Barcelona, a boy discovers a mysterious book that draws him into a dark literary labyrinth.',
    publishedYear: 2001, pages: 487, language: 'English', createdBy: adminId,
  },
  {
    title: 'Outlander', author: 'Diana Gabaldon', category: catMap['Romance'],
    price: 15.99, ratings: 4.8, numReviews: 720, stock: 28,
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
    description: 'A sweeping tale of time travel, history and a love that spans centuries.',
    publishedYear: 1991, pages: 850, language: 'English', createdBy: adminId,
  },
  {
    title: 'The Alchemist', author: 'Paulo Coelho', category: catMap['Fiction'],
    price: 11.99, ratings: 4.7, numReviews: 1500, stock: 90, isBestSeller: true,
    coverImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
    description: 'A shepherd boy journeys in search of treasure and discovers the wisdom of listening to his heart.',
    publishedYear: 1988, pages: 197, language: 'English', createdBy: adminId,
  },
  {
    title: 'The Love Hypothesis', author: 'Ali Hazelwood', category: catMap['Romance'],
    price: 13.49, ratings: 4.5, numReviews: 640, stock: 44, isBestSeller: true,
    coverImage: 'https://images.unsplash.com/photo-1518744386442-2d48ac47a7eb?w=400',
    description: 'A fake-dating STEM romance full of wit, chemistry and heart.',
    publishedYear: 2021, pages: 384, language: 'English', createdBy: adminId,
  },
  {
    title: 'Fourth Wing', author: 'Rebecca Yarros', category: catMap['Fantasy'],
    price: 16.49, ratings: 4.8, numReviews: 2200, stock: 18, isFeatured: true, isBestSeller: true,
    coverImage: 'https://images.unsplash.com/photo-1621944190310-e3cca1564bd7?w=400',
    description: 'Dragons, war college rivalries and a heroine who must survive to become a rider.',
    publishedYear: 2023, pages: 528, language: 'English', createdBy: adminId,
  },
  {
    title: 'It Ends with Us', author: 'Colleen Hoover', category: catMap['Romance'],
    price: 12.99, ratings: 4.7, numReviews: 3100, stock: 52, isBestSeller: true,
    coverImage: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=400',
    description: 'A moving story about love, resilience and the difficult choices that define us.',
    publishedYear: 2016, pages: 384, language: 'English', createdBy: adminId,
  },
  {
    title: 'The Night Circus', author: 'Erin Morgenstern', category: catMap['Fantasy'],
    price: 13.49, ratings: 4.6, numReviews: 880, stock: 30,
    coverImage: 'https://images.unsplash.com/photo-1531928351158-2f736078e0a1?w=400',
    description: 'A magical competition between two illusionists unfolds within a mysterious black-and-white circus.',
    publishedYear: 2011, pages: 512, language: 'English', createdBy: adminId,
  },
];

const run = async () => {
  await connectDB();
  const destroy = process.argv.includes('--destroy');

  await Promise.all([
    User.deleteMany(),
    Category.deleteMany(),
    Book.deleteMany(),
    Coupon.deleteMany(),
  ]);
  if (destroy) {
    console.log('🗑️  Data destroyed');
    return mongoose.connection.close();
  }

  const admin = await User.create({
    name: process.env.SEED_ADMIN_NAME || 'Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@bookhaven.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    role: 'admin',
  });
  const customer = await User.create({
    name: 'Jane Reader', email: 'customer@bookhaven.com', password: 'Customer@123', role: 'customer',
  });

  const createdCats = await Category.create(categories);
  const catMap = Object.fromEntries(createdCats.map((c) => [c.name, c._id]));

  await Book.create(booksSeed(catMap, admin._id));

  await Coupon.create([
    { code: 'WELCOME10', description: '10% off your first order', discountType: 'percentage', discountValue: 10, minPurchase: 20, maxDiscount: 15 },
    { code: 'READ5', description: '$5 off orders over $40', discountType: 'fixed', discountValue: 5, minPurchase: 40 },
  ]);

  console.log('✅ Seed complete');
  console.log(`   Admin:    ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'}`);
  console.log(`   Customer: ${customer.email} / Customer@123`);
  await mongoose.connection.close();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
