# 🌹 Rose Misk Store | Premium Fragrance E-commerce

Rose Misk is a high-performance, luxury e-commerce platform specializing in premium fragrances. Engineered for speed, scalability, and high-end aesthetics, this project showcases a modern technical stack focused on delivering a flawless UI/UX and a robust, secure backend architecture.

---

## 🚀 Key Features

### 🛒 Advanced Shopping Experience

- **Intelligent Cart Synchronization:** Seamlessly merges Guest carts with User accounts upon login using specialized database actions.
- **Complex Product Variants:** Supports multiple volumes (sizes) per fragrance with dynamic pricing and real-time stock tracking.
- **Luxury UI/UX:** Smooth, interactive animations powered by **Framer Motion** and a modern design language using **Tailwind CSS v4**.
- **Fully Responsive:** Optimized for a pixel-perfect experience across all devices, from mobile to ultra-wide monitors.

### 🛡️ Admin & Security

- **Advanced Admin Dashboard:** Full CRUD operations for products and categories with automated SEO-friendly slug generation.
- **Role-Based Access:** Secure admin routes protected via **Better Auth** and server-side session validation.
- **Security-First Order Engine:** Prevents front-end tampering by validating all prices and stock levels directly on the server via Server Actions before transaction completion.
- **Order Tracking:** Real-time status management (Pending, Shipped, Delivered, Cancelled).

### ⚙️ Robust Backend Logic

- **Atomic Transactions:** All order processing and inventory updates are wrapped in **Prisma Transactions** to ensure data integrity.
- **Soft Delete Implementation:** Strategic data retention using `isActive` flags for products to preserve historical order data.
- **Intelligent Revalidation:** Utilizes `revalidatePath` to ensure the dashboard and user pages update instantly without manual refreshes, maintaining a "Single Page App" feel.

---

## 💻 Tech Stack

| Layer              | Technology                                   |
| ------------------ | -------------------------------------------- |
| **Framework**      | Next.js 16 (App Router)                      |
| **Frontend**       | React 19, TypeScript                         |
| **Styling**        | Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Database**       | PostgreSQL (Hosted on Neon)                  |
| **ORM**            | Prisma 7                                     |
| **Authentication** | Better Auth                                  |
| **Media Handling** | UploadThing (High-speed cloud uploads)       |
| **Deployment**     | Vercel                                       |

---

## 🏗️ Architecture & Database

The project follows a clean architecture separating server-side logic from client-side presentation:

- **Relational Mapping:** Optimized one-to-many relationships between Categories, Products, and Variants.
- **Inventory Management:** Automated stock increment/decrement logic during order placement and cancellations.
- **Performance:** Optimized for minimal LCP (Largest Contentful Paint) using Next.js Image component and font optimization.

---

## ⚙️ Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/your-username/rose-misk.git](https://github.com/your-username/rose-misk.git)
   cd rose-misk

   Install dependencies:

   npm install

   Setup Environment Variables:

   DATABASE_URL="your-postgresql-url"
   BETTER_AUTH_SECRET="your-generated-secret"
   UPLOADTHING_SECRET="your-uploadthing-secret"
   UPLOADTHING_APP_ID="your-app-id"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

Prisma Setup:

npx prisma generate
npx prisma db push

Run the development server:

npm run dev

📈 Performance & Roadmap
Lighthouse: Aiming for a perfect 100/100 score across Performance, Accessibility, Best Practices, and SEO.

[x] 100/100 SEO & Accessibility.

[x] Secure Transaction Logic.

[ ] Real-time Analytics Integration.

[ ] Multi-currency Support.

👤 Author
Mustafa Melake
Full Stack Developer | MERN & Next.js Specialist

📍 Menofia, Egypt
💼 Portfolio: Mustafa.dev
✉️ Contact: [Your Email]

Developed with ❤️ by Mustafa Melake
