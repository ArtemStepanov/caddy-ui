import Instance from "@/models/instance.ts";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { Button } from "../../ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Input } from "../../ui/input.tsx";
import { Label } from "../../ui/label.tsx";
import Api from "@/api.ts";
import React, { useMemo, useState } from "react";
import { useExceptionWrapper } from "@/hooks/useExceptionWrapper.ts";
import { Loader } from "@/components/common/loader.tsx";

export interface EditInstanceDialogProps {
  instance: Instance;
  className?: string;
  onEdit?: () => void;
}

export function EditInstanceDialog({
  instance,
  className,
  onEdit,
}: EditInstanceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: instance.name,
    url: instance.url,
  });
  const [touched, setTouched] = useState({ name: false, url: false });

  const errors = useMemo(() => {
    const errors: { name?: string; url?: string } = {};

    if (!formData.name.trim() && touched.name) {
      errors.name = "Name is required";
    }

    if (touched.url) {
      if (!formData.url) {
        errors.url = "URL is required";
      } else {
        const trimmedUrl = formData.url.trim();
        if (trimmedUrl !== formData.url) {
          errors.url = "URL cannot contain spaces";
        } else {
          try {
            const urlObj = new URL(formData.url);
            if (!["http:", "https:"].includes(urlObj.protocol)) {
              errors.url = "URL must use HTTP or HTTPS protocol";
            }
            if (formData.url.includes(" ")) {
              errors.url = "URL cannot contain spaces";
            }
          } catch {
            errors.url = "Please enter a valid URL";
          }
        }
      }
    }

    return errors;
  }, [formData, touched]);

  const isValid =
    !errors.name && !errors.url && formData.name.trim() && formData.url.trim();

  const { toast } = useToast();

  const { execute: handleUpdate, loading } = useExceptionWrapper(async () => {
    await Api.updateCaddyInstance({
      ...instance,
      ...formData,
    });

    toast({
      title: "Success",
      description: `Successfully updated instance "${formData.name}"`,
      variant: "default",
      duration: 2000,
    });

    setIsOpen(false);
    onEdit?.();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUpdate();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] gap-6">
        <DialogHeader>
          <DialogTitle>Edit Instance</DialogTitle>
          <DialogDescription>
            Update the instance name and URL. Both fields are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Instance name"
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              className={`${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="Instance URL"
              type="url"
              onBlur={() => setTouched((prev) => ({ ...prev, url: true }))}
              className={`${errors.url ? "border-red-500" : ""}`}
            />
            {errors.url && (
              <p className="text-sm text-red-500 mt-1">{errors.url}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValid}>
              {loading ? <Loader /> : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
