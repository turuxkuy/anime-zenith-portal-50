
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Donghua {
  id: number;
  title: string;
  year: number;
  genre: string;
  status: string;
  rating: number;
  synopsis: string;
  poster_url?: string | null;
  backdrop_url?: string | null;
  created_at: string;
  updated_at: string;
}

export function useDonghua() {
  const [donghuaList, setDonghuaList] = useState<Donghua[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchDonghua();

    // Set up real-time subscription
    const channel = supabase
      .channel('donghua_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donghua',
        },
        () => {
          fetchDonghua();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDonghua = async () => {
    try {
      const { data, error } = await supabase
        .from('donghua')
        .select('*')
        .order('title', { ascending: true });

      if (error) {
        throw error;
      }

      setDonghuaList(data || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching donghua:', err);
      setError(err);
      setLoading(false);
    }
  };

  const getDonghuaById = async (id: number | string): Promise<Donghua | null> => {
    try {
      const { data, error } = await supabase
        .from('donghua')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`Error fetching donghua with id ${id}:`, err);
      return null;
    }
  };

  const addDonghua = async (donghua: Omit<Donghua, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('donghua')
        .insert(donghua)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `${donghua.title} has been added.`,
      });

      return data;
    } catch (err: any) {
      console.error('Error adding donghua:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to add donghua",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateDonghua = async (id: number, updates: Partial<Donghua>) => {
    try {
      const { error } = await supabase
        .from('donghua')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Donghua has been updated.",
      });

      return true;
    } catch (err: any) {
      console.error('Error updating donghua:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update donghua",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteDonghua = async (id: number) => {
    try {
      const { error } = await supabase
        .from('donghua')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Donghua has been deleted.",
      });

      return true;
    } catch (err: any) {
      console.error('Error deleting donghua:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete donghua",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    donghuaList,
    loading,
    error,
    getDonghuaById,
    addDonghua,
    updateDonghua,
    deleteDonghua,
    fetchDonghua,
  };
}
