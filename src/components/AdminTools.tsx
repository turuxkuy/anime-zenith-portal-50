
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useDonghua } from '@/hooks/useDonghua';
import { useEpisodes } from '@/hooks/useEpisodes';
import { toast } from '@/hooks/use-toast';

export function AdminTools() {
  const [migrating, setMigrating] = useState(false);
  const { isAdmin } = useAuth();
  const { fetchDonghua } = useDonghua();
  const { fetchAllEpisodes } = useEpisodes();

  if (!isAdmin) {
    return null;
  }

  const deleteLocalStorage = async () => {
    if (!confirm('Are you sure you want to remove all local storage data? This action cannot be undone.')) {
      return;
    }

    try {
      localStorage.removeItem('donghuaData');
      localStorage.removeItem('episodesData');
      localStorage.removeItem('users');
      localStorage.removeItem('watchHistory');
      localStorage.removeItem('favorites');
      
      toast({
        title: "Local Storage Cleared",
        description: "All local storage data has been successfully removed.",
      });
    } catch (error) {
      console.error('Error clearing local storage:', error);
      toast({
        title: "Error",
        description: "Failed to clear local storage",
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    setMigrating(true);
    toast({
      title: "Refreshing Data",
      description: "Fetching the latest data from Supabase...",
    });

    try {
      await Promise.all([
        fetchDonghua(),
        fetchAllEpisodes()
      ]);
      
      toast({
        title: "Data Refreshed",
        description: "Successfully fetched the latest data from Supabase.",
      });
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={deleteLocalStorage} 
        variant="destructive"
        className="w-full"
      >
        Remove Local Storage Data
      </Button>
      
      <Button 
        onClick={refreshData}
        disabled={migrating}
        className="w-full"
        variant="outline"
      >
        {migrating ? 'Refreshing...' : 'Refresh Supabase Data'}
      </Button>
    </div>
  );
}
