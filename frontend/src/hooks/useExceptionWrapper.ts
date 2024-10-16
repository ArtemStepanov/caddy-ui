/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useToast } from "./use-toast";

export function useExceptionWrapper<T>(func: (...args: any[]) => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const execute = async (...args: any[]): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      return await func(...args);
    } catch (e) {
      const error = e as Error;
      setError(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
