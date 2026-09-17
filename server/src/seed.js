// One-off seed script: populates the skincare product catalog and a demo
// admin account. Run with: node --env-file-if-exists=.env src/seed.js
// Note: the product catalog is also auto-seeded on server startup if empty
// (see ensureProductCatalog() in index.js) — this script additionally
// creates the demo admin account, which startup does not do.
import bcrypt from "bcryptjs";
import { connectDb } from "./db.js";
import { User } from "./models.js";
import { PRODUCTS, seedProductCatalog } from "./productCatalog.js";

async function main() {
  await connectDb();

  await seedProductCatalog();
  console.log(`[seed] Upserted ${PRODUCTS.length} products.`);

  const adminEmail = "admin@skinanalysis.ai";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await User.create({ fullName: "Site Administrator", email: adminEmail, passwordHash, role: "admin" });
    console.log(`[seed] Created demo admin account: ${adminEmail} / admin123`);
  } else {
    console.log("[seed] Demo admin account already exists.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
