import { useMemo, useState } from "react";
import { Input } from "../../ui/input.tsx";
import { Button } from "../../ui/button.tsx";
import { Loader2 } from "lucide-react";
import Api from "@/api.ts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useExceptionWrapper } from "@/hooks/useExceptionWrapper.ts";

export function AddInstanceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState({ name: false, url: false });

  const errors = useMemo(() => {
    const errors: { name?: string; url?: string } = {};

    if (!name.trim() && touched.name) {
      errors.name = "Name is required";
    }

    if (touched.url) {
      if (!url) {
        errors.url = "URL is required";
      } else {
        // Remove any whitespace
        const trimmedUrl = url.trim();
        if (trimmedUrl !== url) {
          errors.url = "URL cannot contain spaces";
        } else {
          try {
            const urlObj = new URL(url);
            if (!["http:", "https:"].includes(urlObj.protocol)) {
              errors.url = "URL must use HTTP or HTTPS protocol";
            }
            // Check for spaces in different parts of the URL
            if (url.includes(" ")) {
              errors.url = "URL cannot contain spaces";
            }
          } catch {
            errors.url = "Please enter a valid URL";
          }
        }
      }
    }

    return errors;
  }, [name, url, touched]);

  const isValid = !errors.name && !errors.url && name.trim() && url.trim();

  const { execute: handleSubmit, loading } = useExceptionWrapper(async () => {
    await Api.addCaddyInstance({
      name,
      url,
    });
    setOpen(false);
    setName("");
    setUrl("");
    return {
      success: {
        title: "Instance Added",
        description: `Instance "${name}" has been successfully added.`,
      },
      error: {
        title: "Failed to Add Instance",
        description: "Could not add the instance. Please try again.",
      },
    };
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black text-white hover:bg-gray-800">
          Add Instance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Caddy Instance</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleSubmit();
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              className={`w-full ${errors.name ? "border-red-500" : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              className={`w-full ${errors.url ? "border-red-500" : ""}`}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTouched((prev) => ({ ...prev, url: true }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, url: true }))}
              placeholder="https://example.com"
            />
            {errors.url && (
              <p className="text-sm text-red-500 mt-1">{errors.url}</p>
            )}
          </div>
          <Button type="submit" disabled={loading || !isValid}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Instance"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
