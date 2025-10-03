import { useState, useEffect } from "react";
import { Check, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CaddyInstance } from "@/lib/api-client";
import { validateInstanceName, validateAdminUrl, isInstanceNameUnique } from "@/lib/instance-utils";
import { cn } from "@/lib/utils";

interface EditInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: CaddyInstance;
  onSubmit: (id: string, instance: Partial<CaddyInstance>) => Promise<CaddyInstance | undefined>;
  existingInstances: CaddyInstance[];
}

type AuthType = 'none' | 'bearer' | 'mtls' | 'basic';

interface FormData {
  name: string;
  admin_url: string;
  auth_type: AuthType;
  bearer_token: string;
  basic_username: string;
  basic_password: string;
}

interface FormErrors {
  name?: string;
  admin_url?: string;
  bearer_token?: string;
}

export function EditInstanceDialog({ 
  open, 
  onOpenChange, 
  instance, 
  onSubmit, 
  existingInstances 
}: EditInstanceDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: instance.name,
    admin_url: instance.admin_url,
    auth_type: instance.auth_type as AuthType,
    bearer_token: '',
    basic_username: '',
    basic_password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      name: instance.name,
      admin_url: instance.admin_url,
      auth_type: instance.auth_type as AuthType,
      bearer_token: instance.credentials?.token || '',
      basic_username: instance.credentials?.username || '',
      basic_password: instance.credentials?.password || '',
    });
  }, [instance]);

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
  };

  const validateField = (field: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'name': {
        const nameError = validateInstanceName(formData.name);
        if (nameError) {
          newErrors.name = nameError;
        } else if (!isInstanceNameUnique(formData.name, existingInstances, instance.id)) {
          newErrors.name = 'This name is already taken';
        } else {
          delete newErrors.name;
        }
        break;
      }

      case 'admin_url': {
        const urlError = validateAdminUrl(formData.admin_url);
        if (urlError) {
          newErrors.admin_url = urlError;
        } else {
          delete newErrors.admin_url;
        }
        break;
      }

      case 'bearer_token':
        if (formData.auth_type === 'bearer' && !formData.bearer_token.trim()) {
          newErrors.bearer_token = 'Bearer token is required for this auth type';
        } else {
          delete newErrors.bearer_token;
        }
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = (): boolean => {
    validateField('name');
    validateField('admin_url');
    if (formData.auth_type === 'bearer') {
      validateField('bearer_token');
    }

    setTouched({
      name: true,
      admin_url: true,
      bearer_token: formData.auth_type === 'bearer',
    });

    const nameError = validateInstanceName(formData.name);
    const urlError = validateAdminUrl(formData.admin_url);
    const tokenError = formData.auth_type === 'bearer' && !formData.bearer_token.trim();

    return !nameError && !urlError && !tokenError && 
           isInstanceNameUnique(formData.name, existingInstances, instance.id);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const credentials: Record<string, string> = {};
      
      if (formData.auth_type === 'bearer' && formData.bearer_token) {
        credentials.token = formData.bearer_token;
      } else if (formData.auth_type === 'basic') {
        credentials.username = formData.basic_username;
        credentials.password = formData.basic_password;
      }

      await onSubmit(instance.id, {
        name: formData.name,
        admin_url: formData.admin_url,
        auth_type: formData.auth_type,
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update instance:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = !errors.name && !errors.admin_url && !errors.bearer_token &&
                      formData.name.trim().length >= 3 && formData.admin_url.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Instance: {instance.name}</DialogTitle>
          <DialogDescription>
            Update the configuration for this Caddy instance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Instance Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="Production Server"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => handleBlur('name')}
                  className={cn(
                    "bg-background border-border pr-10",
                    errors.name && touched.name && "border-destructive"
                  )}
                />
                {touched.name && !errors.name && formData.name.length >= 3 && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
                {touched.name && errors.name && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                )}
              </div>
              {touched.name && errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Admin URL */}
            <div className="space-y-2">
              <Label htmlFor="admin_url">
                Admin API URL <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="admin_url"
                  placeholder="http://localhost:2019"
                  value={formData.admin_url}
                  onChange={(e) => setFormData({ ...formData, admin_url: e.target.value })}
                  onBlur={() => handleBlur('admin_url')}
                  className={cn(
                    "bg-background border-border pr-10",
                    errors.admin_url && touched.admin_url && "border-destructive"
                  )}
                />
                {touched.admin_url && !errors.admin_url && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
              {touched.admin_url && errors.admin_url && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.admin_url}
                </p>
              )}
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Authentication</h3>
            
            <div className="space-y-2">
              <Label htmlFor="auth_type">
                Authentication Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.auth_type}
                onValueChange={(value: AuthType) => setFormData({ ...formData, auth_type: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none">None - No authentication required</SelectItem>
                  <SelectItem value="bearer">Bearer Token - Use API token</SelectItem>
                  <SelectItem value="mtls">mTLS - Mutual TLS certificates</SelectItem>
                  <SelectItem value="basic">Basic - Username and password</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bearer Token */}
            {formData.auth_type === 'bearer' && (
              <div className="space-y-2">
                <Label htmlFor="bearer_token">
                  Bearer Token <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="bearer_token"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your API token"
                    value={formData.bearer_token}
                    onChange={(e) => setFormData({ ...formData, bearer_token: e.target.value })}
                    onBlur={() => handleBlur('bearer_token')}
                    className={cn(
                      "bg-background border-border pr-10",
                      errors.bearer_token && touched.bearer_token && "border-destructive"
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {touched.bearer_token && errors.bearer_token && (
                  <p className="text-sm text-destructive">{errors.bearer_token}</p>
                )}
              </div>
            )}

            {/* Basic Auth */}
            {formData.auth_type === 'basic' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="basic_username">Username</Label>
                  <Input
                    id="basic_username"
                    placeholder="Username"
                    value={formData.basic_username}
                    onChange={(e) => setFormData({ ...formData, basic_username: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basic_password">Password</Label>
                  <Input
                    id="basic_password"
                    type="password"
                    placeholder="Password (leave empty to keep current)"
                    value={formData.basic_password}
                    onChange={(e) => setFormData({ ...formData, basic_password: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            )}

            {/* mTLS Warning */}
            {formData.auth_type === 'mtls' && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-sm text-orange-500">
                  ⚠️ mTLS configuration requires manual certificate setup on the backend.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="bg-gradient-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
