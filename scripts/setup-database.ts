import 'dotenv/config';
import { db } from '../db/index';
import { seedDatabase } from '../db/seed-tnt-data';

async function setupDatabase() {
  console.log("🔧 开始设置数据库...");

  try {
    // Test database connection
    console.log("📡 测试数据库连接...");
    await db.execute('SELECT 1 as test');
    console.log("✅ 数据库连接成功");

    // Run the seed function
    await seedDatabase();

    console.log("🎉 数据库设置完成！");
    process.exit(0);
  } catch (error) {
    console.error("❌ 数据库设置失败:", error);
    console.log("\n💡 提示：请确保PostgreSQL数据库正在运行，并且DATABASE_URL配置正确");
    process.exit(1);
  }
}

setupDatabase();