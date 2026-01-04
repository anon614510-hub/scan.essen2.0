# Database Integration Plan (Optimized for Performance)

## Objective
To implement a high-performance, scalable database layer using PostgreSQL and Prisma.

## Tech Decision: Why PostgreSQL over MongoDB?

This plan selects **PostgreSQL** as the "perfect" choice. Here is why it beats MongoDB for this specific app:

| Feature | PostgreSQL (Proposed) | MongoDB | Winner for Scan-Essen |
| :--- | :--- | :--- | :--- |
| **Data Integrity** | **Strict**. If a User is deleted, their Recipes are automatically removed (Cascade). No "orphaned" data. | **Loose**. You must manually write code to find and delete related data. | **PostgreSQL** |
| **Flexibility** | **Hybrid**. Stores structured data (Users) efficiently AND handles unstructured JSON (Recipes) perfectly using `JSONB`. | **High**. Great for pure JSON, but weaker for complex relationships. | **PostgreSQL** (Best of both worlds) |
| **Complex Queries** | **Powerful**. Can easily join Users with their Recipes and Ingredients in one fast query. | **Expensive**. `$lookup` (joins) are slower and harder to maintain. | **PostgreSQL** |
| **Type Safety** | **Excellent**. Works seamlessly with Prisma to generate exact TypeScript types. | **Good**, but requires Mongoose schemas which can drift from the database reality. | **PostgreSQL** |

**Verdict**: PostgreSQL gives you the **reliability** of an SQL database with the **flexibility** of a NoSQL database (via the JSON column for recipes). It is the industry standard for modern Next.js apps.

## Optimized Schema Design

```prisma
// Existing User model
model User {
  id        String       @id
  email     String       @unique
  profile   UserProfile?
  // Relation: User has many ingredients and recipes
  ingredients Ingredient[]
  recipes     Recipe[]
}

// User Profile (No changes, but ensure userId is indexed implicitly by @unique)
model UserProfile {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... existing fields ...
}

// OPTIMIZED: Ingredient Model
model Ingredient {
  id           String   @id @default(cuid())
  userId       String
  // PERFORMANCE: Index this column for fast inventory lookups
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name         String
  quantity     String?
  expiryStatus String?  // "fresh", "soon", "expired"
  createdAt    DateTime @default(now())

  @@index([userId]) // <--- FAST LOOKUP
}

// OPTIMIZED: Recipe Model
model Recipe {
  id          String   @id @default(cuid())
  userId      String
  // PERFORMANCE: Index this column
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title       String
  
  // DATA STRUCTURE: Extract key metrics for sorting/filtering
  cookingTime Int?     // e.g. minutes
  calories    Int?     
  healthScore Int?
  
  content     Json     // Full details (instructions, extended props)
  createdAt   DateTime @default(now())

  @@index([userId])    // <--- FAST LOOKUP
  @@index([healthScore]) // Optional: if we want to sort by healthiest
}
```

## Performance Strategy

### 1. Transactions for Inventory
When saving ingredients, instead of deleting one-by-one or creating one-by-one, we will use a **Prisma Transaction**.
- **Logic**: `[deleteMany({ userId }), createMany({ data })]`
- **Benefit**: Ensures the inventory is never in a "half-updated" state and reduces database round-trips.

### 2. Efficient Data Fetching
In the Dashboard (`getUserDashboardData`), we will use `Promise.all` to run queries in parallel:
1. Count Recipes.
2. Count Ingredients.
3. Calculate Average Health Score.
**Benefit**: Reduces loading time by running 3 queries simultaneously instead of sequentially.

### 3. Connection Pooling
Since `Next.js` runs in a serverless environment (typically), we must ensure we don't exhaust database connections.
- **Solution**: Use `Uncaught Exception Handler` singleton pattern for `PrismaClient` (already in `src/lib/db.ts`).
- **Cloud**: When using Neon/Supabase, use the **Transaction Pooler** URL (usually port 6543) instead of the direct Session connection (port 5432) for high concurrency.

## Revised Implementation Steps

1.  **Update Schema**: Apply the optimized schema above.
2.  **Generate Client**: `npx prisma generate`
3.  **Implement Logic**: Write `db-actions.ts` using the Transaction method.
4.  **Connect UI**: Point `actions.ts` to the new logic.
