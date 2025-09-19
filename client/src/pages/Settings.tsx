import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Palette, Text, Layout, Eye, EyeOff } from 'lucide-react';

export function UiControlPanel() {
  const { toast } = useToast();
  const [uiSettings, setUiSettings] = useState({
    reducedAnimations: false,
    highContrast: false,
    fontSize: 16,
    density: 'normal',
    showImages: true,
    colorScheme: 'system',
  });

  const handleUiSettingChange = (setting: string, value: any) => {
    setUiSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
    
    toast({
      title: "تم تحديث إعدادات الواجهة",
      description: "تم تطبيق التغييرات بنجاح",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <Palette className="h-6 w-6 text-primary" />
            المظهر والألوان
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="reducedAnimations" className="text-foreground font-medium cursor-pointer">
                تقليل الحركات والتحويلات
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                تقليل الحركات لتحسين الأداء وتقليل التشتيت
              </p>
            </div>
            <Switch
              id="reducedAnimations"
              checked={uiSettings.reducedAnimations}
              onCheckedChange={(value) => handleUiSettingChange('reducedAnimations', value)}
            />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="highContrast" className="text-foreground font-medium cursor-pointer">
                وضع التباين العالي
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                تحسين وضوح العناصر لذوي الإعاقات البصرية
              </p>
            </div>
            <Switch
              id="highContrast"
              checked={uiSettings.highContrast}
              onCheckedChange={(value) => handleUiSettingChange('highContrast', value)}
            />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="colorScheme" className="text-foreground font-medium cursor-pointer">
                نظام الألوان
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                اختيار نظام الألوان المناسب للواجهة
              </p>
            </div>
            <Select 
              value={uiSettings.colorScheme} 
              onValueChange={(value) => handleUiSettingChange('colorScheme', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">النظام</SelectItem>
                <SelectItem value="light">فاتح</SelectItem>
                <SelectItem value="dark">داكن</SelectItem>
                <SelectItem value="auto">تلقائي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <Text className="h-6 w-6 text-primary" />
            النصوص والعرض
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="fontSize" className="text-foreground font-medium">
                حجم الخط
              </Label>
              <span className="text-sm text-muted-foreground">{uiSettings.fontSize}px</span>
            </div>
            <Slider
              id="fontSize"
              min={12}
              max={24}
              step={1}
              value={[uiSettings.fontSize]}
              onValueChange={(value) => handleUiSettingChange('fontSize', value[0])}
            />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="density" className="text-foreground font-medium cursor-pointer">
            كثافة العناصر
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                التحكم في المسافات بين العناصر
              </p>
            </div>
            <Select 
              value={uiSettings.density} 
              onValueChange={(value) => handleUiSettingChange('density', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">مضغوط</SelectItem>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="comfortable">مريح</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <Layout className="h-6 w-6 text-primary" />
            تخطيط الصفحة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="showImages" className="text-foreground font-medium cursor-pointer">
                عرض الصور
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                إظهار أو إخفاء الصور لتسريع التصفح
              </p>
            </div>
            <div className="flex items-center gap-2">
              {uiSettings.showImages ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <Switch
                id="showImages"
                checked={uiSettings.showImages}
                onCheckedChange={(value) => handleUiSettingChange('showImages', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => {
          setUiSettings({
            reducedAnimations: false,
            highContrast: false,
            fontSize: 16,
            density: 'normal',
            showImages: true,
            colorScheme: 'system',
          });
          toast({
            title: "تم الاستعادة",
            description: "تم استعادة الإعدادات الافتراضية",
          });
        }}>
          استعادة الإعدادات
        </Button>
        <Button onClick={() => {
          toast({
            title: "تم التطبيق",
            description: "تم تطبيق إعدادات الواجهة بنجاح",
          });
        }}>
          تطبيق التغييرات
        </Button>
      </div>
    </div>
  );
}
