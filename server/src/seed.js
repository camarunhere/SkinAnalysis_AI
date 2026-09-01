// One-off seed script: populates the skincare product catalog and a demo
// admin account. Run with: node --env-file-if-exists=.env src/seed.js
import bcrypt from "bcryptjs";
import { connectDb } from "./db.js";
import { Product, User } from "./models.js";

const PRODUCTS = [
  { condition: "acne", category: "cleanser", name: "Salicylic Acid Cleanser", description: "2% salicylic acid face wash that clears pores and reduces breakouts.", usageInstructions: "Use once or twice daily on damp skin, rinse after 60 seconds." },
  { condition: "acne", category: "treatment", name: "Benzoyl Peroxide Spot Treatment", description: "5% benzoyl peroxide gel that targets acne-causing bacteria.", usageInstructions: "Apply a thin layer to blemishes after cleansing, once daily." },
  { condition: "acne", category: "moisturizer", name: "Oil-Free Gel Moisturizer", description: "Lightweight, non-comedogenic hydration for acne-prone skin.", usageInstructions: "Apply morning and night after treatment products." },

  { condition: "eczema", category: "cleanser", name: "Fragrance-Free Gentle Cleanser", description: "Soap-free cleanser formulated for sensitive, eczema-prone skin.", usageInstructions: "Use lukewarm water; pat dry, don't rub." },
  { condition: "eczema", category: "moisturizer", name: "Ceramide Repair Cream", description: "Rich ceramide-based cream that restores the skin barrier.", usageInstructions: "Apply generously within 3 minutes of bathing to lock in moisture." },
  { condition: "eczema", category: "treatment", name: "Colloidal Oatmeal Treatment", description: "Soothes itching and inflammation associated with flare-ups.", usageInstructions: "Apply to affected areas up to 3 times daily." },

  { condition: "rosacea", category: "cleanser", name: "Soothing Micellar Cleanser", description: "Alcohol-free micellar water that removes impurities without irritation.", usageInstructions: "Wipe gently with a cotton pad, no rinsing required." },
  { condition: "rosacea", category: "treatment", name: "Azelaic Acid Treatment", description: "10% azelaic acid to reduce redness and inflammatory bumps.", usageInstructions: "Apply a thin layer once daily, build up tolerance gradually." },
  { condition: "rosacea", category: "sunscreen", name: "Mineral Sunscreen SPF30", description: "Zinc-oxide mineral sunscreen — a key rosacea trigger is UV exposure.", usageInstructions: "Apply every morning, reapply every 2 hours outdoors." },

  { condition: "keratosis", category: "cleanser", name: "AHA Exfoliating Cleanser", description: "Glycolic acid cleanser that gently lifts rough, scaly patches.", usageInstructions: "Use 2-3 times per week, not daily, to avoid over-exfoliating." },
  { condition: "keratosis", category: "treatment", name: "Urea Cream 10%", description: "Keratolytic cream that softens and smooths thickened skin.", usageInstructions: "Apply to affected areas nightly." },
  { condition: "keratosis", category: "sunscreen", name: "Broad-Spectrum SPF50 Sunscreen", description: "High-SPF protection, since sun damage is a major risk factor.", usageInstructions: "Apply daily, regardless of weather." },

  { condition: "milia", category: "cleanser", name: "Gentle Foaming Cleanser", description: "Non-stripping cleanser that won't aggravate delicate under-eye skin.", usageInstructions: "Use twice daily with lukewarm water." },
  { condition: "milia", category: "treatment", name: "Retinol Night Treatment", description: "Encourages cell turnover to help clear trapped keratin.", usageInstructions: "Apply a pea-sized amount at night, start 2-3x/week." },
  { condition: "milia", category: "moisturizer", name: "Lightweight Gel Moisturizer", description: "Hydrates without clogging pores around the eyes and cheeks.", usageInstructions: "Apply morning and night." },

  { condition: "carcinoma", category: "medical", name: "Dermatologist Referral", description: "This result pattern warrants an in-person evaluation by a board-certified dermatologist as soon as possible. This tool does not diagnose cancer.", usageInstructions: "Book a dermatology appointment promptly; do not delay for self-treatment." },
];

async function main() {
  await connectDb();

  for (const p of PRODUCTS) {
    await Product.updateOne({ name: p.name }, { $set: p }, { upsert: true });
  }
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
