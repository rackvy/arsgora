import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// async function main() {
//     const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
//     const password = process.env.SEED_ADMIN_PASSWORD || "password123";
//
//     const passwordHash = await bcrypt.hash(password, 10);
//
//     const user = await prisma.user.upsert({
//         where: { email },
//         update: {
//             role: "ADMIN",
//             passwordHash,
//         },
//         create: {
//             email,
//             passwordHash,
//             role: "ADMIN",
//         },
//     });
//
//     console.log("Admin user ready:", {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//     });
// }
//
// main()
//     .catch((e) => {
//         console.error(e);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });


async function main() {
    await prisma.appSetting.upsert({
        where: { key: "CODE_PRICE_RUB" },
        update: {},
        create: { key: "CODE_PRICE_RUB", value: "500" },
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
