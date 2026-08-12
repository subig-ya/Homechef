const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Dish = require('../models/Dish');
const Review = require('../models/Review');

dotenv.config({ path: __dirname + '/../.env' });

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/homechef';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing data...');
    await Category.deleteMany({});
    await Dish.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});

    console.log('Seeding Categories...');
    const categories = await Category.insertMany([
      { name: 'Italian', description: 'Fresh artisanal pasta, risotto, and wood-fired treats', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600' },
      { name: 'Asian Fusion', description: 'Flavorful curries, stir-fries, and artisanal dumplings', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Mediterranean', description: 'Fresh mezze boards, falafel, and olive oil delights', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600' },
      { name: 'Desserts', description: 'Decadent homemade pastries, cakes, and gelato', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600' }
    ]);

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.name] = cat._id;
    });

    console.log('Seeding Users (single account system)...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Every user below is a normal account. They become sellers by creating listings.
    const admin = await User.create({
      name: 'Admin HomeChef',
      email: 'admin@homechef.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '555-0000',
      location: 'Kathmandu',
      latitude: 27.7172,
      longitude: 85.3240
    });

    const user1 = await User.create({
      name: 'Maria Rossi',
      email: 'maria@homechef.com',
      password: hashedPassword,
      role: 'HOMECHEF',
      phone: '555-0101',
      location: 'Downtown',
      latitude: 40.7128,
      longitude: -74.0060,
      profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
      tagline: 'Five-star Italian cooking for your table',
      bio: 'I grew up in my grandmother\u2019s kitchen in Bologna and have spent ten years bringing authentic Italian home cooking to private dinners across the city.',
      specialties: ['Italian', 'Fresh pasta', 'Risotto', 'Dinner parties'],
      yearsOfExperience: 10,
      coverImage: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200',
      portfolio: [
        {
          image: 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=800',
          title: 'Private pasta night',
          caption: 'Handmade linguine for an eight-seat dinner in a family home.'
        },
        {
          image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
          title: 'Tiramisu for ten',
          caption: 'Classic tiramisu made fresh on the day of a celebration lunch.'
        },
        {
          image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
          title: 'Sunday family feast',
          caption: 'A slow-cooked Italian spread served straight from the home kitchen.'
        }
      ]
    });

    const user2 = await User.create({
      name: 'Kenji Sato',
      email: 'kenji@homechef.com',
      password: hashedPassword,
      role: 'HOMECHEF',
      phone: '555-0102',
      location: 'Westside',
      latitude: 40.7250,
      longitude: -74.0150,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      tagline: 'East-meets-west flavours from my home kitchen',
      bio: 'Trained in Tokyo and cooking for friends ever since. My menus blend classic Japanese technique with bold Nepali and South-East Asian spices.',
      specialties: ['Asian Fusion', 'Momo', 'Vegan', 'Curries'],
      yearsOfExperience: 7,
      coverImage: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=1200',
      portfolio: [
        {
          image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800',
          title: 'Momo masterclass',
          caption: 'Thirty hand-folded momos served with house tomato chutney.'
        },
        {
          image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
          title: 'Tasting menu at home',
          caption: 'A five-course Asian tasting menu cooked for a birthday dinner.'
        },
        {
          image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
          title: 'Vegan curry night',
          caption: 'Coconut curries and pickles for a fully plant-based evening.'
        }
      ]
    });

    const user3 = await User.create({
      name: 'Elena Rostova',
      email: 'elena@homechef.com',
      password: hashedPassword,
      role: 'HOMECHEF',
      phone: '555-0103',
      location: 'North Hills',
      latitude: 40.7400,
      longitude: -73.9800,
      profileImage: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=200',
      tagline: 'Mediterranean mezze & fresh feasts, made to share',
      bio: 'From the Black Sea coast to your dining room \u2014 I cook vibrant, healthy Mediterranean spreads for family gatherings and celebrations.',
      specialties: ['Mediterranean', 'Mezze', 'Desserts', 'Catering'],
      yearsOfExperience: 12,
      coverImage: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=1200',
      portfolio: [
        {
          image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
          title: 'Mezze spread',
          caption: 'Homemade dips, falafel and fresh salads for a rooftop gathering.'
        },
        {
          image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
          title: 'Fine dining at home',
          caption: 'A plated Mediterranean dinner served course by course.'
        },
        {
          image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800',
          title: 'Celebration catering',
          caption: 'Grazing table prepared for a family anniversary party.'
        }
      ]
    });

    console.log('Seeding Food Listings matching UI mockups...');
    await Dish.insertMany([
      {
        sellerId: user1._id,
        categoryId: catMap['Italian'],
        name: 'Handmade Linguine Vongole',
        description: 'Fresh pasta tossed in a delicate white wine and garlic sauce with local clams and parsley.',
        cuisine: 'Italian',
        price: 24,
        location: user1.location,
        latitude: user1.latitude,
        longitude: user1.longitude,
        availableQuantity: 15,
        availabilityStatus: 'AVAILABLE',
        dietary: ['Vegetarian'],
        rating: 4.9,
        reviewCount: 128,
        image: 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=800'
      },
      {
        sellerId: user2._id,
        categoryId: catMap['Asian Fusion'],
        name: 'Lemongrass Tofu Curry',
        description: 'A fragrant, medium-spicy coconut curry loaded with organic tofu and crisp fresh vegetables.',
        cuisine: 'Asian Fusion',
        price: 18,
        location: user2.location,
        latitude: user2.latitude,
        longitude: user2.longitude,
        availableQuantity: 20,
        availabilityStatus: 'AVAILABLE',
        dietary: ['Vegan', 'Gluten-Free'],
        rating: 4.7,
        reviewCount: 84,
        image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800'
      },
      {
        sellerId: user3._id,
        categoryId: catMap['Mediterranean'],
        name: 'Artisanal Mezze Board',
        description: 'A curated selection of homemade dips, falafel, and fresh salads perfect for sharing. Includes fresh pita.',
        cuisine: 'Mediterranean',
        price: 32,
        location: user3.location,
        latitude: user3.latitude,
        longitude: user3.longitude,
        availableQuantity: 10,
        availabilityStatus: 'AVAILABLE',
        dietary: ['Vegan', 'Gluten-Free'],
        rating: 5.0,
        reviewCount: 215,
        image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800'
      },
      {
        sellerId: user1._id,
        categoryId: catMap['Italian'],
        name: 'Truffle Wild Mushroom Risotto',
        description: 'Creamy Arborio rice with sautéed wild mushrooms, white truffle oil, and aged parmesan.',
        cuisine: 'Italian',
        price: 28,
        location: user1.location,
        latitude: user1.latitude,
        longitude: user1.longitude,
        availableQuantity: 12,
        availabilityStatus: 'AVAILABLE',
        dietary: ['Vegetarian', 'Gluten-Free'],
        rating: 4.8,
        reviewCount: 95,
        image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=800'
      },
      {
        sellerId: user3._id,
        categoryId: catMap['Desserts'],
        name: 'Signature Tiramisu Cup',
        description: 'Classic Italian dessert made with espresso-soaked ladyfingers, rich mascarpone cream, and cocoa powder.',
        cuisine: 'Italian',
        price: 14,
        location: user3.location,
        latitude: user3.latitude,
        longitude: user3.longitude,
        availableQuantity: 25,
        availabilityStatus: 'AVAILABLE',
        dietary: ['Vegetarian'],
        rating: 4.9,
        reviewCount: 160,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800'
      },
      {
        sellerId: user2._id,
        categoryId: catMap['Asian Fusion'],
        name: 'Authentic Nepalese Momo Dumplings',
        description: 'Steamed artisanal dumplings filled with spiced organic vegetables, served with homemade tomato sesame chutney.',
        cuisine: 'Asian Fusion',
        price: 16,
        location: user2.location,
        latitude: user2.latitude,
        longitude: user2.longitude,
        availableQuantity: 30,
        availabilityStatus: 'AVAILABLE',
        dietary: ['Vegan'],
        rating: 5.0,
        reviewCount: 310,
        image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800'
      }
    ]);

    console.log('Seeding chef reviews...');
    await Review.insertMany([
      { customerId: admin._id, sellerId: user1._id, rating: 5, comment: 'Maria cooked an incredible pasta dinner for our family of eight. Professional, warm, and the food was outstanding.' },
      { customerId: user2._id, sellerId: user1._id, rating: 4, comment: 'Lovely risotto and great conversation. Would happily book again.' },
      { customerId: user3._id, sellerId: user1._id, rating: 5, comment: 'The tiramisu was the highlight of our anniversary dinner. Thank you Maria!' },
      { customerId: admin._id, sellerId: user2._id, rating: 5, comment: 'Kenji\u2019s momos are the best I\u2019ve tasted outside of Nepal. A brilliant chef for any occasion.' },
      { customerId: user1._id, sellerId: user2._id, rating: 4, comment: 'Creative menu and beautiful plating. The vegan curry was a crowd favourite.' },
      { customerId: admin._id, sellerId: user3._id, rating: 5, comment: 'Elena put together a stunning mezze spread for our rooftop party. Everything tasted fresh and homemade.' },
      { customerId: user1._id, sellerId: user3._id, rating: 5, comment: 'Beautiful grazing table and such a kind host. She made our celebration feel effortless.' },
      { customerId: user2._id, sellerId: user3._id, rating: 4, comment: 'Great food, great energy. Would love to have her back for the next family gathering.' }
    ]);

    console.log('Seeded accounts (password123):');
    console.log('  Admin:  admin@homechef.com');
    console.log('  User:   maria@homechef.com / kenji@homechef.com / elena@homechef.com');

    console.log('DB Seed Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error Seeding DB:', error);
    process.exit(1);
  }
};

seedData();
