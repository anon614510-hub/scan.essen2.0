
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

console.log("DEBUG: DATABASE_URL is", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
    console.log("Connecting using explicit datasources config...");
    try {
        const count = await prisma.user.count();
        console.log(`Success! Found ${count} users.`);
    } catch (e) {
        console.error("Connection failed:", e);
        console.error("Detailed error:", JSON.stringify(e, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
