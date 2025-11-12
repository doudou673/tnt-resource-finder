import 'dotenv/config';
import { db } from './index';
import { members, events, insertMemberSchema, insertEventSchema } from './schema/tnt-resources';

// TNT Members data
const tntMembers = [
  {
    name: "马嘉祺",
    stageName: "Ma Jiaqi",
    groupRole: "队长, 主唱",
  },
  {
    name: "丁程鑫",
    stageName: "Ding Chengxin",
    groupRole: "主舞",
  },
  {
    name: "宋亚轩",
    stageName: "Song Yaxuan",
    groupRole: "主唱",
  },
  {
    name: "刘耀文",
    stageName: "Liu Yaowen",
    groupRole: "主舞, 说唱",
  },
  {
    name: "张真源",
    stageName: "Zhang Zhenyuan",
    groupRole: "主唱",
  },
  {
    name: "严浩翔",
    stageName: "Yan Haoxiang",
    groupRole: "说唱",
  },
  {
    name: "贺峻霖",
    stageName: "He Junlin",
    groupRole: "说唱, 主持",
  }
];

// Sample Events data
const tntEvents = [
  {
    title: "时代少年团出道三周年演唱会",
    eventDate: new Date("2022-11-23"),
    description: "时代少年团出道三周年纪念演唱会",
    venue: "重庆国际博览中心",
  },
  {
    title: "家族演唱会",
    eventDate: new Date("2023-08-26"),
    description: "TF家族年度演唱会",
    venue: "北京工人体育馆",
  },
  {
    title: " billboard Music Awards",
    eventDate: new Date("2023-11-28"),
    description: "时代少年团参加billboard音乐颁奖典礼",
    venue: "洛杉矶",
  },
  {
    title: "《无尽的冒险》专辑发布",
    eventDate: new Date("2023-12-01"),
    description: "时代少年团新专辑《无尽的冒险》正式发布",
    venue: "线上发布",
  },
  {
    title: "《要你管》MV拍摄",
    eventDate: new Date("2023-10-15"),
    description: "新歌《要你管》MV拍摄花絮",
    venue: "摄影棚",
  }
];

async function seedDatabase() {
  console.log("🌱 开始填充时代少年团数据...");

  try {
    // Insert members
    console.log("📝 添加成员数据...");
    for (const memberData of tntMembers) {
      const validatedMember = insertMemberSchema.parse(memberData);
      await db.insert(members).values(validatedMember).onConflictDoNothing({
        target: members.stageName,
      });
      console.log(`✅ 已添加成员: ${validatedMember.stageName}`);
    }

    // Insert events
    console.log("📝 添加活动数据...");
    for (const eventData of tntEvents) {
      const validatedEvent = insertEventSchema.parse(eventData);
      await db.insert(events).values(validatedEvent).onConflictDoNothing({
        target: events.title,
      });
      console.log(`✅ 已添加活动: ${validatedEvent.title}`);
    }

    console.log("🎉 数据填充完成！");

    // Display inserted data
    console.log("\n📊 数据统计:");
    const memberCount = await db.select().from(members);
    const eventCount = await db.select().from(events);
    console.log(`👥 成员数量: ${memberCount.length}`);
    console.log(`🎪 活动数量: ${eventCount.length}`);

  } catch (error) {
    console.error("❌ 数据填充失败:", error);
    throw error;
  }
}

// Run seed function if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("✨ 种子数据填充完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 种子数据填充失败:", error);
      process.exit(1);
    });
}

export { seedDatabase };