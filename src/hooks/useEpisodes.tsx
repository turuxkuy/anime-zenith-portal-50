
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Episode {
  id: string;
  donghua_id: number;
  episode_number: number;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  duration?: number | null;
  is_vip: boolean;
  release_date: string;
  created_at: string;
  updated_at: string;
}

export function useEpisodes(donghuaId?: number) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (donghuaId !== undefined) {
      fetchEpisodesByDonghuaId(donghuaId);
    } else {
      fetchAllEpisodes();
    }

    // Set up real-time subscription
    const channel = supabase
      .channel('episodes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'episodes',
          filter: donghuaId ? `donghua_id=eq.${donghuaId}` : undefined,
        },
        () => {
          if (donghuaId !== undefined) {
            fetchEpisodesByDonghuaId(donghuaId);
          } else {
            fetchAllEpisodes();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [donghuaId]);

  const fetchAllEpisodes = async () => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .order('donghua_id', { ascending: true })
        .order('episode_number', { ascending: true });

      if (error) {
        throw error;
      }

      setEpisodes(data || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching episodes:', err);
      setError(err);
      setLoading(false);
    }
  };

  const fetchEpisodesByDonghuaId = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('donghua_id', id)
        .order('episode_number', { ascending: true });

      if (error) {
        throw error;
      }

      setEpisodes(data || []);
      setLoading(false);
    } catch (err: any) {
      console.error(`Error fetching episodes for donghua ${id}:`, err);
      setError(err);
      setLoading(false);
    }
  };

  const getEpisodeById = async (id: string): Promise<Episode | null> => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`Error fetching episode with id ${id}:`, err);
      return null;
    }
  };

  const addEpisode = async (episode: Omit<Episode, 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .insert(episode)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Episode ${episode.episode_number} has been added.`,
      });

      return data;
    } catch (err: any) {
      console.error('Error adding episode:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to add episode",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateEpisode = async (id: string, updates: Partial<Episode>) => {
    try {
      const { error } = await supabase
        .from('episodes')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Episode has been updated.",
      });

      return true;
    } catch (err: any) {
      console.error('Error updating episode:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update episode",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteEpisode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Episode has been deleted.",
      });

      return true;
    } catch (err: any) {
      console.error('Error deleting episode:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete episode",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    episodes,
    loading,
    error,
    getEpisodeById,
    addEpisode,
    updateEpisode,
    deleteEpisode,
    fetchEpisodesByDonghuaId,
    fetchAllEpisodes,
  };
}
