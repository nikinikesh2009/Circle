import { storage } from "./server/storage";
import bcrypt from "bcryptjs";

async function testPassword() {
  const creds = await storage.getAdminCredentials();
  console.log("Admin credentials found:", !!creds);
  
  if (creds) {
    console.log("Secret emails:", creds.secretEmails);
    console.log("Backup codes:", creds.backupCodes);
    
    const testPassword = "AdminPassword12345678901234567890";
    console.log("\nTesting password:", testPassword);
    console.log("Password length:", testPassword.length);
    
    const matches = await bcrypt.compare(testPassword, creds.password);
    console.log("Password matches:", matches);
    
    // Also test the storage method
    const verifyResult = await storage.verifyAdminPassword(testPassword);
    console.log("Verify method result:", verifyResult);
  }
}

testPassword().then(() => process.exit(0)).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
