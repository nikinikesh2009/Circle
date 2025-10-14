import { storage } from "./storage";

async function seedAdmin() {
  try {
    console.log("🔐 Seeding admin credentials...");
    
    // Check if admin credentials already exist
    const existing = await storage.getAdminCredentials();
    if (existing) {
      console.log("✅ Admin credentials already exist");
      console.log("\n📋 ADMIN LOGIN CREDENTIALS:");
      console.log("Password: AdminPassword12345678901234567890");
      console.log("Secret Emails: admin@example.com OR admin@circle.com");
      console.log("Backup Codes: 1234 AND 5678");
      return;
    }

    // Create admin credentials
    const adminCreds = await storage.createAdminCredentials({
      password: "AdminPassword12345678901234567890", // 32 characters
      secretEmails: ["admin@example.com", "admin@circle.com"],
      backupCodes: ["1234", "5678"],
    });

    console.log("✅ Admin credentials created successfully!");
    console.log("\n📋 ADMIN LOGIN CREDENTIALS:");
    console.log("Step 1 - Password: AdminPassword12345678901234567890");
    console.log("Step 2 - Secret Email: admin@example.com OR admin@circle.com");
    console.log("Step 3 - Backup Codes: 1234 AND 5678");
    console.log("\n🔗 Admin Login URL: http://localhost:5000/admin/login/step1");
    
    // Create some default settings
    await storage.upsertSystemSetting("dm_enabled", "true", "Enable direct messaging");
    await storage.upsertSystemSetting("explore_enabled", "true", "Enable explore page");
    await storage.upsertSystemSetting("circle_creation_enabled", "true", "Enable circle creation");
    await storage.upsertSystemSetting("ai_enabled", "true", "Enable AI assistant");
    await storage.upsertSystemSetting("maintenance_mode", "false", "Maintenance mode");
    
    console.log("✅ Default settings created");
    
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    throw error;
  }
}

seedAdmin()
  .then(() => {
    console.log("\n✨ Admin setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  });
