import { db } from '../db/drizzle';
import { orderTracking, users } from '../db/schema';

export class OrderTrackingService {
  static async createSystemTracking(orderId: string, status: string, message: string) {
    try {
      // الحصول على system user ID أو إنشائه
      const systemUserId = await this.getSystemUserId();
      
      await db.insert(orderTracking).values({
        orderId,
        status,
        message,
        createdBy: systemUserId,
        createdByType: 'system'
      });
    } catch (error) {
      console.error('Error creating order tracking:', error);
      throw error;
    }
  }

  private static async getSystemUserId(): Promise<string> {
    // البحث عن مستخدم النظام
    const systemUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'system')
    });

    if (systemUser) {
      return systemUser.id;
    }

    // إنشاء مستخدم النظام إذا لم يوجد
    const [newSystemUser] = await db.insert(users).values({
      username: 'system',
      name: 'System User',
      phone: '0000000000',
      isActive: true
    }).returning();

    return newSystemUser.id;
  }
}
