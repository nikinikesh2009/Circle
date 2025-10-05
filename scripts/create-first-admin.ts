import { db } from "../server/db";
import { admins } from "../shared/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function validate32DigitPassword(password: string): { valid: boolean; error?: string } {
  if (password.length !== 32) {
    return { valid: false, error: "Password must be exactly 32 characters long" };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return { 
      valid: false, 
      error: "Password must contain uppercase, lowercase, numbers, and special characters" 
    };
  }
  
  return { valid: true };
}

async function createFirstAdmin() {
  try {
    console.log("\n🔐 Create First Admin Account\n");
    
    // Check if any admins exist
    const existingAdmins = await db.select().from(admins);
    if (existingAdmins.length > 0) {
      console.log("❌ Admin accounts already exist. Use the admin dashboard to create more admins.");
      console.log(`   Existing admins: ${existingAdmins.map(a => a.email).join(", ")}`);
      process.exit(1);
    }
    
    const email = await question("Enter admin email: ");
    if (!email || !email.includes("@")) {
      console.log("❌ Invalid email address");
      process.exit(1);
    }
    
    const password = await question("Enter 32-character password: ");
    const passwordValidation = validate32DigitPassword(password);
    if (!passwordValidation.valid) {
      console.log(`❌ ${passwordValidation.error}`);
      process.exit(1);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create admin
    const id = randomUUID();
    const [newAdmin] = await db.insert(admins).values({
      id,
      email,
      passwordHash,
      role: "super_admin",
      isActive: true,
    }).returning();
    
    console.log("\n✅ First admin account created successfully!");
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   Login at: /admin/login\n`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createFirstAdmin();
