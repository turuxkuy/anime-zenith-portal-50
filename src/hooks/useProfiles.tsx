
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Profile {
  id: string;
  username: string;
  email?: string | null;
  role: string;
  created_at: string;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('profiles_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
          },
          () => {
            fetchProfiles();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProfiles(data || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
      setError(err);
      setLoading(false);
    }
  };

  const getProfileById = async (id: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`Error fetching profile with id ${id}:`, err);
      return null;
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only admins can update user roles",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `User role updated to ${role}.`,
      });

      return true;
    } catch (err: any) {
      console.error('Error updating user role:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update user role",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    profiles,
    loading,
    error,
    getProfileById,
    updateUserRole,
    fetchProfiles,
  };
}
