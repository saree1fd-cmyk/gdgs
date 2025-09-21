import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Shield, Phone, Bell, Camera } from 'lucide-react';

interface LocationPermissionModalProps {
  onPermissionGranted: (position: GeolocationPosition) => void;
  onPermissionDenied: () => void;
}

export function LocationPermissionModal({ onPermissionGranted, onPermissionDenied }: LocationPermissionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [currentStep, setCurrentStep] = useState(0);
  const [grantedPermissions, setGrantedPermissions] = useState<string[]>([]);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const permissions = [
    {
      id: 'location',
      icon: MapPin,
      title: 'الوصول للموقع',
      description: 'لتحديد موقعك وعرض المطاعم القريبة وتوصيل الطلبات بدقة',
      required: true,
      requestFunction: requestLocationPermission
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'الإشعارات',
      description: 'لإرسال تحديثات الطلب والعروض الخاصة',
      required: true,
      requestFunction: requestNotificationPermission
    },
    {
      id: 'phone',
      icon: Phone,
      title: 'الاتصال الهاتفي',
      description: 'للتواصل مع المطعم والمندوب عند الحاجة',
      required: false,
      requestFunction: () => Promise.resolve(true)
    },
    {
      id: 'camera',
      icon: Camera,
      title: 'الكاميرا',
      description: 'لرفع صور من الطلبات أو المشاكل (اختياري)',
      required: false,
      requestFunction: requestCameraPermission
    }
  ];

  const checkPermissionStatus = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (permission.state === 'granted') {
          setPermissionStatus('granted');
          getCurrentLocation();
        } else if (permission.state === 'denied') {
          setPermissionStatus('denied');
          setIsOpen(true);
        } else {
          setPermissionStatus('unknown');
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            onPermissionGranted(position);
            resolve(true);
          },
          (error) => {
            console.error('Error getting location:', error);
            resolve(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        resolve(false);
      }
    });
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      if (!('Notification' in window)) {
        return false;
      }
      if (Notification.permission === 'granted') {
        return true;
      }
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Notification error:', error);
      return false;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera error:', error);
      return false;
    }
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPermissionStatus('granted');
          onPermissionGranted(position);
          setIsOpen(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setPermissionStatus('denied');
          onPermissionDenied();
          setIsOpen(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  };

  const handlePermissionRequest = async (permission: any) => {
    const granted = await permission.requestFunction();
    if (granted) {
      setGrantedPermissions(prev => [...prev, permission.id]);
    }
    
    // الانتقال للصلاحية التالية أو إنهاء العملية
    if (currentStep < permissions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // انتهاء جميع الصلاحيات
      setIsOpen(false);
    }
  };

  const handleSkipPermission = () => {
    if (currentStep < permissions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handleSkipAll = () => {
    setIsOpen(false);
    onPermissionDenied();
  };

  const currentPermission = permissions[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {currentPermission && <currentPermission.icon className="h-6 w-6 text-primary" />}
          </div>
          <DialogTitle className="text-xl font-bold">
            {currentPermission?.title || 'صلاحيات التطبيق'}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            عزيزي العميل، هذا التطبيق يحتاج للصلاحيات التالية لتوفير أفضل خدمة لك
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-4">
            {permissions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-primary' : 
                  index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentPermission && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                <currentPermission.icon className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium">{currentPermission.title}</div>
                  <div className="text-muted-foreground">{currentPermission.description}</div>
                  {currentPermission.required && (
                    <div className="text-xs text-red-600 mt-1">مطلوب للتطبيق</div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleSkipPermission}
                  className="flex-1"
                >
                  {currentPermission.required ? 'تخطي' : 'لاحقاً'}
                </Button>
                <Button 
                  onClick={() => handlePermissionRequest(currentPermission)}
                  className="flex-1"
                >
                  السماح
                </Button>
              </div>

              {currentStep === 0 && (
                <Button 
                  variant="ghost" 
                  onClick={handleSkipAll}
                  className="w-full text-xs"
                >
                  تخطي جميع الصلاحيات
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
