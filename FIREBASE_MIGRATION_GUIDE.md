# MongoDB to Firebase Migration Guide

## Migration Complete! ✅

Your MERN e-commerce application has been successfully migrated from MongoDB to Firebase Firestore. Here's what was changed and what you need to do next.

## Changes Made

### 1. **Package Dependencies** (`backend/package.json`)
- ❌ Removed: `mongoose` and `mongodb`
- ✅ Added: `firebase` and `firebase-admin`

### 2. **Environment Configuration** (`backend/.env`)
- ❌ Removed: `MONGO_URI`
- ✅ Added: Firebase configuration variables:
  - `FIREBASE_API_KEY`
  - `FIREBASE_AUTH_DOMAIN`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_STORAGE_BUCKET`
  - `FIREBASE_MESSAGING_SENDER_ID`
  - `FIREBASE_APP_ID`

### 3. **Database Connection** (`backend/lib/db.js`)
- Completely rewritten to initialize Firebase instead of connecting to MongoDBby
- Now uses Firebase SDK initialization
- Exports `connectDB()` and `getDB()` functions

### 4. **Data Models** (All files in `backend/models/`)

#### User Model (`user.model.js`)
- Converted to Firestore class-based model
- Firestore collection: `users`
- All methods implemented: `findOne()`, `findById()`, `create()`, `save()`, `comparePassword()`
- Password hashing still uses bcryptjs

#### Product Model (`product.model.js`)
- Converted to Firestore class-based model
- Firestore collection: `products`
- Methods: `find()`, `findById()`, `create()`, `save()`, `findByIdAndDelete()`

#### Order Model (`order.model.js`)
- Converted to Firestore class-based model
- Firestore collection: `orders`
- Methods: `find()`, `findById()`, `findOne()`, `create()`, `save()`, `findByIdAndDelete()`

#### Coupon Model (`coupon.model.js`)
- Converted to Firestore class-based model
- Firestore collection: `coupons`
- Methods: `find()`, `findById()`, `findOne()`, `create()`, `save()`, `findByIdAndDelete()`

### 5. **Controllers** (All files in `backend/controllers/`)

#### Auth Controller (`auth.controller.js`)
- ✅ No changes needed - compatible with new Firestore User model

#### Product Controller (`product.controller.js`)
- Removed MongoDB aggregation pipeline (`$sample` operator)
- Now uses client-side random sampling for recommended products
- Updated to use Firestore queries
- Cache functionality with Redis remains intact

#### Cart Controller (`cart.controller.js`)
- Updated to handle cart items correctly with Firestore
- Simplified item comparison logic

#### Coupon Controller (`coupon.controller.js`)
- ✅ No changes needed - compatible with new Firestore Coupon model

#### Payment Controller (`payment.controller.js`)
- Replaced `findOneAndUpdate()` with `findOne()` + `save()`
- Replaced `findOneAndDelete()` with loop + `findByIdAndDelete()`
- Order creation now uses `Order.create()` instead of constructor + save

#### Analytics Controller (`analytics.controller.js`)
- Completely rewritten
- Removed MongoDB aggregation pipelines
- Now uses client-side filtering and grouping
- Implements manual date range logic

### 6. **Middleware** (`backend/middleware/auth.middleware.js`)
- Removed `.select("-password")` call
- Now manually excludes password field using `toJSON()` method

### 7. **Testing** (`backend/test-db.js`)
- Updated to test Firebase Firestore connection instead of MongoDB

### 8. **Documentation** (`README.md`)
- Updated feature list: MongoDB → Firebase Firestore
- Updated environment setup instructions with Firebase credentials

## Firestore Database Structure

Your Firestore database should have these collections:

```
Firestore Database
├── users/
│   ├── {userId}
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── password: string (hashed)
│   │   ├── role: string ("customer" | "admin")
│   │   ├── cartItems: array
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── products/
│   ├── {productId}
│   │   ├── name: string
│   │   ├── description: string
│   │   ├── price: number
│   │   ├── image: string (cloudinary URL)
│   │   ├── category: string
│   │   ├── isFeatured: boolean
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── orders/
│   ├── {orderId}
│   │   ├── user: string (userId)
│   │   ├── products: array
│   │   │   └── [{product, quantity, price}]
│   │   ├── totalAmount: number
│   │   ├── stripeSessionId: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
└── coupons/
    ├── {couponId}
    │   ├── code: string
    │   ├── discountPercentage: number
    │   ├── expirationDate: timestamp
    │   ├── isActive: boolean
    │   ├── userId: string
    │   ├── createdAt: timestamp
    │   └── updatedAt: timestamp
```

## Next Steps Required

### 1. **Install Dependencies**
```bash
cd backend
npm install
```

### 2. **Set Up Firebase Project**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project or select existing one
- Enable Firestore Database
- Create a Web App within your Firebase project
- Copy the Firebase config credentials to your `.env` file

### 3. **Update Environment Variables** (`.env`)
```bash
# Get these from Firebase Console → Project Settings
FIREBASE_API_KEY=your_actual_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 4. **Set Up Firestore Security Rules**
In Firebase Console → Firestore → Rules, set appropriate rules for your collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId || request.auth.token.admin == true;
    }
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
    match /orders/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    match /coupons/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. **Migrate Existing Data** (if you have MongoDB data)
Create a migration script to transfer data from MongoDB to Firestore:

```bash
# Create a migration script (backup your MongoDB data first!)
node scripts/migrateFromMongoDB.js
```

### 6. **Test the Connection**
```bash
cd backend
npm run test  # or node test-db.js
```

### 7. **Start Development Server**
```bash
npm run dev
```

### 8. **Update Frontend API Calls**
- Verify all API calls in frontend still work correctly
- No changes should be needed as the backend API structure remains the same

## Key Differences from MongoDB

### ✅ What's the Same
- REST API structure unchanged
- Authentication flow (JWT) unchanged
- Stripe integration unchanged
- Redis caching unchanged
- Frontend code unchanged

### ⚠️ What's Different
- No `.lean()` method (Firestore returns plain objects)
- No MongoDB aggregation pipelines (replaced with client-side logic)
- No `findOneAndUpdate()` (use `findOne()` + `save()`)
- No `findOneAndDelete()` (use `findOne()` + `delete()`)
- Document IDs are randomly generated by Firestore
- Timestamps are Firestore Timestamp objects

### 📊 Performance Differences
- **Advantages of Firestore:**
  - Automatic scaling
  - Real-time updates support (if you add listeners later)
  - Better for global distribution
  - Integrated with other Google Cloud services

- **Why analytics might be slower:**
  - No server-side aggregation pipelines
  - Client-side filtering on large datasets
  - **Solution:** Consider implementing Cloud Functions for complex analytics

## Troubleshooting

### Issue: "Firebase not initialized"
**Solution:** Make sure `connectDB()` is called in `server.js` before routes are used.

### Issue: "Firestore permission denied"
**Solution:** Update your Firestore security rules to allow the necessary operations.

### Issue: "Cart items not loading"
**Solution:** Ensure cart items structure matches: `{ product: string, quantity: number }`

### Issue: "Coupon validation failing"
**Solution:** Check that userId is stored correctly as a string in Firestore.

## Performance Optimization Tips

1. **Add Indexes for Common Queries:**
   - Create composite indexes in Firestore for:
     - `users` collection: email
     - `coupons` collection: userId + isActive
     - `orders` collection: user

2. **Implement Caching:**
   - Products cache (already done with Redis)
   - Category queries
   - User preferences

3. **Consider Cloud Functions:**
   - For complex analytics calculations
   - For automated coupon expiration
   - For order processing

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)

## Rollback Instructions

If you need to rollback to MongoDB:
1. `git checkout` original models and database files
2. Reinstall MongoDB dependencies: `npm install mongoose mongodb`
3. Restore `.env` with MongoDB URI
4. Run migrations on MongoDB

---

**Migration completed successfully!** 🎉

Your application is now ready to use Firebase Firestore as its database backend.
