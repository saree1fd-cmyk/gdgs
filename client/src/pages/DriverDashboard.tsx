import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Truck, 
  MapPin, 
  Clock, 
  DollarSign, 
  LogOut,
  Navigation,
  Phone,
  CheckCircle,
  XCircle,
  Package,
  Settings,
  TrendingUp,
  Activity,
  Map,
  Bell,
  User,
  Calendar,
  Target
} from 'lucide-react';
import type { Order, Driver } from '@shared/schema';

interface DriverDashboardProps {
  onLogout: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [driverStatus, setDriverStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // الحصول على معرف السائق من localStorage
  const [driverId, setDriverId] = useState<string>('');

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const token = localStorage.getItem('driver_token');
    const driverData = localStorage.getItem('driver_user');
    
    if (!token || !driverData) {
      // إعادة توجيه لصفحة تسجيل الدخول
      window.location.href = '/driver-login';
      return;
    }

    try {
      const driver = JSON.parse(driverData);
      setDriverId(driver.id);
      setCurrentDriver(driver);
      setDriverStatus(driver.isAvailable ? 'available' : 'offline');
    } catch (error) {
      console.error('Error parsing driver data:', error);
      handleLogout();
    }
  }, []);

  // Fetch driver info
  const { data: driver } = useQuery<Driver>({
    queryKey: ['/api/drivers', driverId],
    enabled: !!driverId,
  });

  // Fetch available orders
  const { data: availableOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders', { status: 'confirmed' }],
    enabled: !!driverId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch driver orders
  const { data: myOrders } = useQuery<Order[]>({
    queryKey: ['/api/orders', { driverId, status: 'on_way,preparing,ready' }],
    enabled: !!driverId,
  });

  // Fetch driver stats
  const { data: todayStats } = useQuery({
    queryKey: ['/api/drivers', driverId, 'stats', 'today'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/drivers/${driverId}/stats?period=today`);
      return response.json();
    },
    enabled: !!driverId,
  });

  const { data: weekStats } = useQuery({
    queryKey: ['/api/drivers', driverId, 'stats', 'week'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/drivers/${driverId}/stats?period=week`);
      return response.json();
    },
    enabled: !!driverId,
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest('PUT', `/api/drivers/${driverId}`, {
        isAvailable: status === 'available',
        currentLocation: currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers', driverId] });
      toast({ title: 'تم تحديث الحالة بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في تحديث الحالة', variant: 'destructive' });
    },
  });

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('PUT', `/api/orders/${orderId}`, {
        status: 'preparing',
        driverId: driverId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setDriverStatus('busy');
      toast({ title: 'تم قبول الطلب بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في قبول الطلب', variant: 'destructive' });
    },
  });

  // Complete order mutation
  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('PUT', `/api/orders/${orderId}`, {
        status: 'delivered',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drivers', driverId, 'stats'] });
      setDriverStatus('available');
      toast({ title: 'تم تسليم الطلب بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في تسليم الطلب', variant: 'destructive' });
    },
  });

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('خطأ في الحصول على الموقع:', error);
        }
      );
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_user');
    onLogout();
  };

  const toggleStatus = () => {
    const newStatus = driverStatus === 'available' ? 'offline' : 'available';
    setDriverStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toFixed(2)} ريال`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'busy': return 'bg-orange-100 text-orange-700';
      case 'offline': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'متاح';
      case 'busy': return 'مشغول';
      case 'offline': return 'غير متاح';
      default: return 'غير معروف';
    }
  };

  const currentOrder = myOrders?.find(order => 
    order.status === 'accepted' || order.status === 'preparing' || order.status === 'ready'
  );

  // عرض شاشة تحميل إذا لم يتم تحميل بيانات السائق
  if (!currentDriver || !driverId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات السائق...</p>
        </div>
      </div>
    );
  }

  // Render main dashboard
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">تطبيق السائق</h1>
                <p className="text-sm text-gray-500">{currentDriver.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(driverStatus)}>
                {getStatusText(driverStatus)}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="dashboard">الرئيسية</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
            <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Status Toggle */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">حالة العمل</h3>
                    <p className="text-sm text-muted-foreground">
                      {driverStatus === 'available' ? 'متاح لاستقبال الطلبات' : 'غير متاح'}
                    </p>
                  </div>
                  <Button 
                    variant={driverStatus === 'available' ? "destructive" : "default"}
                    onClick={toggleStatus}
                    disabled={updateStatusMutation.isPending}
                    className={driverStatus === 'available' ? "" : "bg-green-600 hover:bg-green-700"}
                  >
                    {driverStatus === 'available' ? 'إيقاف العمل' : 'بدء العمل'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <Package className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">طلبات اليوم</p>
                      <p className="text-2xl font-bold text-blue-600">{todayStats?.totalOrders || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">أرباح اليوم</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(todayStats?.totalEarnings || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Order */}
            {currentOrder && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Package className="h-5 w-5" />
                    الطلب الحالي - #{currentOrder.id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">معلومات العميل</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Phone className="h-4 w-4" />
                          {currentOrder.customerPhone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4" />
                          {currentOrder.deliveryAddress}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">تفاصيل الطلب</p>
                        <p className="text-sm text-gray-600 mt-1">المجموع: {formatCurrency(currentOrder.totalAmount)}</p>
                        <p className="text-sm text-gray-600">رسوم التوصيل: {formatCurrency(currentOrder.deliveryFee)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={() => window.open(`https://maps.google.com/?q=${currentOrder.deliveryAddress}`, '_blank')}
                        size="sm"
                        variant="outline"
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => window.open(`tel:${currentOrder.customerPhone}`, '_self')}
                        size="sm"
                        variant="outline"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => completeOrderMutation.mutate(currentOrder.id)}
                        disabled={completeOrderMutation.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  الطلبات المتاحة ({availableOrders?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : driverStatus !== 'available' ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">قم بتفعيل حالة التوفر لاستقبال الطلبات</p>
                  </div>
                ) : !availableOrders || availableOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">لا توجد طلبات متاحة حالياً</p>
                ) : (
                  <div className="space-y-4">
                    {availableOrders.map((order) => (
                      <Card key={order.id} className="border hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold">طلب #{order.orderNumber || order.id.slice(0, 8)}</h4>
                              <p className="text-sm text-muted-foreground">{order.customerName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
                              <p className="text-xs text-muted-foreground">
                                عمولة: {formatCurrency(parseFloat(order.totalAmount) * 0.1)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{order.deliveryAddress}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(order.createdAt.toString())}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`)}
                            >
                              <MapPin className="h-4 w-4" />
                              الموقع
                            </Button>
                          <Button
                            onClick={() => acceptOrderMutation.mutate(order.id)}
                            disabled={acceptOrderMutation.isPending || driverStatus !== 'available'}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                            قبول
                          </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs content would go here */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تاريخ الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                {myOrders && myOrders.length > 0 ? (
                  <div className="space-y-4">
                    {myOrders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">طلب #{order.orderNumber || order.id.slice(0, 8)}</p>
                              <p className="text-sm text-gray-600">{order.customerName}</p>
                            </div>
                            <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                              {order.status === 'delivered' ? 'مكتمل' : 'قيد التنفيذ'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{order.deliveryAddress}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">{formatDate(order.createdAt.toString())}</span>
                            <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground p-8">لا توجد طلبات</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    إحصائيات اليوم
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{todayStats?.totalOrders || 0}</div>
                      <div className="text-sm text-gray-600">طلبات اليوم</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(todayStats?.totalEarnings || 0)}</div>
                      <div className="text-sm text-gray-600">أرباح اليوم</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    إحصائيات الأسبوع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{weekStats?.totalOrders || 0}</div>
                      <div className="text-sm text-gray-600">طلبات الأسبوع</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{formatCurrency(weekStats?.totalEarnings || 0)}</div>
                      <div className="text-sm text-gray-600">أرباح الأسبوع</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  الملف الشخصي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-lg">{currentDriver.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentDriver.phone}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>الحالة:</span>
                    <Badge className={getStatusColor(driverStatus)}>
                      {getStatusText(driverStatus)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>متاح للعمل:</span>
                    <span className="font-medium">{currentDriver.isAvailable ? 'نعم' : 'لا'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>إجمالي الأرباح:</span>
                    <span className="font-bold text-green-600">{formatCurrency(currentDriver.earnings || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};