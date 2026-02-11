cd ~/ecommerce-api
cat > README.md << 'EOF'
# 🛒 E-Commerce API

Advanced e-commerce REST API with complete shopping functionality, payment processing, reviews, wishlist, and admin dashboard.

## 🚀 Features

### Core Features
- ✅ **User Authentication** - JWT-based auth with role-based access control (CUSTOMER, SELLER, ADMIN)
- ✅ **Product Catalog** - Categories, products with variants, search & filter
- ✅ **Shopping Cart** - Add, update, remove items with real-time calculations
- ✅ **Wishlist** - Save favorite products for later
- ✅ **Order Management** - Complete checkout flow with order tracking
- ✅ **Address Management** - Multiple shipping addresses with default selection
- ✅ **Reviews & Ratings** - Product reviews with 5-star rating system
- ✅ **Payment Processing** - Mock Stripe integration (ready for production)
- ✅ **Admin Dashboard** - Sales analytics, order management, user statistics

### Advanced Features
- 🔐 **Secure Authentication** - Password hashing, JWT tokens, refresh tokens
- 📦 **Inventory Management** - Automatic stock updates on orders
- 💰 **Smart Pricing** - Tax calculation (10%), free shipping over $100
- ⭐ **Verified Reviews** - Verified purchase badges for authentic reviews
- 📊 **Analytics** - Dashboard with sales stats, top products, order insights
- 🔍 **Advanced Search** - Filter by category, price range, availability, featured
- 🛡️ **Role-Based Access** - Customer, Seller, Admin roles with permissions
- 📱 **API Documentation** - Well-structured RESTful endpoints

## 📦 Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express
- **Database:** PostgreSQL
- **ORM:** Prisma 5
- **Authentication:** JWT (jsonwebtoken)
- **Password:** bcrypt
- **Validation:** Express validators
- **CORS:** cors

## 🛠️ Installation

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/CerenTurker/E-Commerce-API.git
cd ecommerce-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=6000
NODE_ENV=development

DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce_db?schema=public"

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

4. **Create database**
```bash
createdb ecommerce_db
```

5. **Run migrations**
```bash
npx prisma migrate dev
```

6. **Generate Prisma Client**
```bash
npx prisma generate
```

7. **Start development server**
```bash
npm run dev
```

Server runs on `http://localhost:6000`

## 📍 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |

### 🏷️ Categories

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/categories` | Get all categories | ❌ | - |
| GET | `/api/categories/:id` | Get single category | ❌ | - |
| POST | `/api/categories` | Create category | ✅ | Admin/Seller |
| PUT | `/api/categories/:id` | Update category | ✅ | Admin/Seller |
| DELETE | `/api/categories/:id` | Delete category | ✅ | Admin |

### 📦 Products

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/products` | Get all products (filtered) | ❌ | - |
| GET | `/api/products/featured` | Get featured products | ❌ | - |
| GET | `/api/products/:id` | Get single product | ❌ | - |
| POST | `/api/products` | Create product | ✅ | Admin/Seller |
| PUT | `/api/products/:id` | Update product | ✅ | Admin/Seller |
| DELETE | `/api/products/:id` | Delete product | ✅ | Admin |

**Product Filters:**
```
?search=iphone
?categoryId=uuid
?minPrice=100&maxPrice=1000
?inStock=true
?isFeatured=true
?sortBy=price&sortOrder=asc
?page=1&limit=12
```

### 🛒 Shopping Cart

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | Get user cart | ✅ |
| POST | `/api/cart/items` | Add item to cart | ✅ |
| PUT | `/api/cart/items/:itemId` | Update cart item | ✅ |
| DELETE | `/api/cart/items/:itemId` | Remove from cart | ✅ |
| DELETE | `/api/cart` | Clear cart | ✅ |

### 💖 Wishlist

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/wishlist` | Get wishlist | ✅ |
| POST | `/api/wishlist/items` | Add to wishlist | ✅ |
| DELETE | `/api/wishlist/items/:itemId` | Remove from wishlist | ✅ |
| DELETE | `/api/wishlist` | Clear wishlist | ✅ |

### 📍 Addresses

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/addresses` | Get all addresses | ✅ |
| GET | `/api/addresses/:id` | Get single address | ✅ |
| POST | `/api/addresses` | Create address | ✅ |
| PUT | `/api/addresses/:id` | Update address | ✅ |
| DELETE | `/api/addresses/:id` | Delete address | ✅ |

### 📦 Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Create order (checkout) | ✅ |
| GET | `/api/orders` | Get user orders | ✅ |
| GET | `/api/orders/:id` | Get single order | ✅ |
| POST | `/api/orders/:id/cancel` | Cancel order | ✅ |

### ⭐ Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/reviews` | Create review | ✅ |
| GET | `/api/reviews/product/:productId` | Get product reviews | ❌ |
| GET | `/api/reviews/my-reviews` | Get user reviews | ✅ |
| PUT | `/api/reviews/:id` | Update review | ✅ |
| DELETE | `/api/reviews/:id` | Delete review | ✅ |

### 💳 Payment

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payment/create-intent` | Create payment intent | ✅ |
| POST | `/api/payment/confirm` | Confirm payment | ✅ |
| GET | `/api/payment/status/:orderId` | Get payment status | ✅ |
| POST | `/api/payment/refund` | Refund payment | ✅ Admin |

### 👨‍💼 Admin

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/admin/dashboard` | Get dashboard stats | ✅ | Admin |
| GET | `/api/admin/orders` | Get all orders | ✅ | Admin |
| PUT | `/api/admin/orders/:id` | Update order status | ✅ | Admin |
| GET | `/api/admin/users` | Get all users | ✅ | Admin |

## 🧪 API Examples

### Register User
```bash
curl -X POST http://localhost:6000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }'
```

### Login
```bash
curl -X POST http://localhost:6000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'
```

### Create Product (Admin/Seller)
```bash
curl -X POST http://localhost:6000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "iPhone 15 Pro",
    "slug": "iphone-15-pro",
    "description": "Latest iPhone with A17 Pro chip",
    "price": 999.99,
    "sku": "IPHONE15PRO",
    "stock": 50,
    "categoryId": "category-uuid",
    "brand": "Apple",
    "isFeatured": true,
    "images": ["https://example.com/iphone.jpg"]
  }'
```

### Add to Cart
```bash
curl -X POST http://localhost:6000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": "product-uuid",
    "quantity": 2
  }'
```

### Checkout (Create Order)
```bash
curl -X POST http://localhost:6000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "addressId": "address-uuid",
    "paymentMethod": "credit_card",
    "notes": "Please deliver during business hours"
  }'
```

### Create Review
```bash
curl -X POST http://localhost:6000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": "product-uuid",
    "rating": 5,
    "title": "Amazing product!",
    "comment": "Best purchase ever. Highly recommended!"
  }'
```

## 🗂️ Database Schema

### User
- Authentication credentials
- Profile information
- Role (CUSTOMER, SELLER, ADMIN)
- Relations: addresses, orders, reviews, cart, wishlist

### Category
- Hierarchical categories
- Support for nested subcategories
- Relations: products, parent, children

### Product
- Complete product information
- Pricing (price, comparePrice, costPrice)
- Inventory (stock, lowStockThreshold)
- Multiple images support
- Relations: category, variants, reviews, orderItems

### Order
- Order details and status tracking
- Payment information
- Pricing breakdown (subtotal, tax, shipping, total)
- Relations: user, address, items

### Cart & Wishlist
- User-specific cart and wishlist
- Relations: user, items (products)

### Review
- 5-star rating system
- Verified purchase badges
- Optional images
- Relations: user, product

## 🔐 Security Features

- **Password Hashing:** bcrypt with salt rounds
- **JWT Authentication:** Access tokens (1h) + Refresh tokens (7d)
- **Role-Based Access Control:** Customer, Seller, Admin permissions
- **Input Validation:** Request validation middleware
- **CORS Protection:** Configured cross-origin policies
- **SQL Injection Prevention:** Prisma ORM parameterized queries

## 💰 Pricing & Calculations

- **Tax:** 10% on subtotal
- **Shipping:** 
  - FREE for orders over $100
  - $10 flat rate for orders under $100
- **Formula:** `Total = Subtotal + Tax + Shipping - Discount`

## 📊 Admin Dashboard Stats

- Total users, products, orders
- Total revenue (paid orders only)
- Pending orders count
- Low stock products alert
- Orders by status breakdown
- Recent orders list
- Top selling products

## 🧪 Testing

### Manual Testing

1. **Register users** (Customer, Seller, Admin)
2. **Create categories** and products (Seller/Admin)
3. **Add to cart** and checkout (Customer)
4. **Complete payment** flow
5. **Leave reviews** on purchased products
6. **Admin dashboard** - manage orders

### Test Accounts
```bash
# Customer
Email: customer@example.com
Password: password123

# Admin
Email: admin@shop.com
Password: admin123
```

## 📄 Scripts
```json
{
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "migrate": "npx prisma migrate dev",
  "studio": "npx prisma studio"
}
```

## 🗂️ Project Structure
```
ecommerce-api/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── category.controller.ts
│   │   ├── product.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── wishlist.controller.ts
│   │   ├── address.controller.ts
│   │   ├── order.controller.ts
│   │   ├── review.controller.ts
│   │   ├── admin.controller.ts
│   │   └── payment.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── category.routes.ts
│   │   ├── product.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── wishlist.routes.ts
│   │   ├── address.routes.ts
│   │   ├── order.routes.ts
│   │   ├── review.routes.ts
│   │   ├── admin.routes.ts
│   │   └── payment.routes.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── jwt.ts
│   └── server.ts
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Deployment

### Production Setup

1. Set `NODE_ENV=production` in environment
2. Use strong JWT secrets
3. Configure production database URL
4. Set up CORS for your frontend domain
5. Enable HTTPS/SSL
6. Use PM2 or similar for process management

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=6000
DATABASE_URL=your-production-db-url
JWT_SECRET=strong-random-secret-min-32-chars
JWT_REFRESH_SECRET=different-strong-random-secret
```

## 📝 License

MIT

## 👤 Author

Ceren Demir

## 🙏 Acknowledgments

- [Express](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [JWT](https://jwt.io/)

---

**⭐ If you find this project useful, please consider giving it a star!**
EOF
