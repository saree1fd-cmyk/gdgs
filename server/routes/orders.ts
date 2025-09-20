import express from "express";
import { storage } from "../storage.js";
import * as schema from "../../shared/schema.js";
import { OrderTrackingService } from '../services/orderTrackingService';

const router = express.Router();

// إنشاء طلب جديد
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      customerLocationLat,
      customerLocationLng,
      notes,
      paymentMethod,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      restaurantId
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!customerName || !customerPhone || !deliveryAddress || !items || !restaurantId) {
      return res.status(400).json({
        error: "بيانات ناقصة: يرجى التأكد من إدخال الاسم، الهاتف، العنوان، العناصر، والمطعم"
      });
    }

    // إنشاء بيانات الطلب
    const orderData: schema.InsertOrder = {
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      deliveryAddress,
      customerLocationLat: customerLocationLat || null,
      customerLocationLng: customerLocationLng || null,
      notes: notes || null,
      paymentMethod: paymentMethod || "cash",
      status: "pending",
      subtotal,
      deliveryFee,
      totalAmount,
      restaurantId
    };

    // حفظ الطلب في قاعدة البيانات
    const order = await storage.createOrder(orderData, items);

    // ✅ استخدام الخدمة الجديدة لتتبع حالة الطلب
    await OrderTrackingService.createSystemTracking(
      order.id, 
      'pending', 
      'تم استلام الطلب وجاري المراجعة'
    );

    res.status(201).json({
      message: "تم إنشاء الطلب بنجاح",
      order
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      error: "فشل في إنشاء الطلب. يرجى المحاولة مرة أخرى لاحقاً"
    });
  }
});

// الحصول على طلب بواسطة المعرف
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await storage.getOrder(id);

    if (!order) {
      return res.status(404).json({
        error: "الطلب غير موجود"
      });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      error: "فشل في جلب بيانات الطلب"
    });
  }
});

// تحديث حالة الطلب
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "حالة الطلب مطلوبة"
      });
    }

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "on_the_way", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "حالة الطلب غير صالحة"
      });
    }

    const order = await storage.updateOrderStatus(id, status);

    if (!order) {
      return res.status(404).json({
        error: "الطلب غير موجود"
      });
    }

    // ✅ استخدام الخدمة الجديدة لتتبع حالة الطلب
    let message = "";
    switch (status) {
      case "confirmed":
        message = "تم تأكيد الطلب";
        break;
      case "preparing":
        message = "جاري تحضير الطلب";
        break;
      case "ready":
        message = "الطلب جاهز للتسليم";
        break;
      case "on_the_way":
        message = "الطلب في الطريق للتسليم";
        break;
      case "delivered":
        message = "تم تسليم الطلب بنجاح";
        break;
      case "cancelled":
        message = "تم إلغاء الطلب";
        break;
      default:
        message = "تم تحديث حالة الطلب";
    }

    await OrderTrackingService.createSystemTracking(
      id, 
      status, 
      message
    );

    res.json({
      message: "تم تحديث حالة الطلب بنجاح",
      order
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      error: "فشل في تحديث حالة الطلب"
    });
  }
});

// الحصول على تتبع الطلب
router.get("/:id/tracking", async (req, res) => {
  try {
    const { id } = req.params;
    const tracking = await storage.getOrderTracking(id);

    res.json(tracking);
  } catch (error) {
    console.error("Error fetching order tracking:", error);
    res.status(500).json({
      error: "فشل في جلب تتبع الطلب"
    });
  }
});

// الحصول على طلبات المطعم
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const orders = await storage.getRestaurantOrders(
      restaurantId,
      status as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json(orders);
  } catch (error) {
    console.error("Error fetching restaurant orders:", error);
    res.status(500).json({
      error: "فشل في جلب طلبات المطعم"
    });
  }
});

export default router;
