
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function MigrationButton() {
  const [migrating, setMigrating] = useState(false);
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return null;
  }

  const migrateData = async () => {
    if (!confirm('Are you sure you want to migrate data from localStorage to Supabase? This will overwrite any existing data in Supabase.')) {
      return;
    }

    setMigrating(true);
    toast({
      title: "Migration Started",
      description: "Data migration is in progress...",
    });

    try {
      // Step 1: Migrate donghua data
      const donghuaData = JSON.parse(localStorage.getItem('donghuaData') || '[]');
      if (donghuaData.length > 0) {
        // Convert the array structure to objects with proper fields
        const formattedDonghua = donghuaData.map((donghua: any, index: number) => ({
          title: donghua.title || 'Unknown Title',
          year: donghua.year || new Date().getFullYear(),
          genre: donghua.genre || 'Unknown',
          status: donghua.status || 'Ongoing',
          rating: donghua.rating || 0,
          synopsis: donghua.synopsis || '',
          poster_url: donghua.poster || null,
          backdrop_url: donghua.backdrop || null,
        }));

        // Insert donghua records
        const { error: donghuaError } = await supabase
          .from('donghua')
          .insert(formattedDonghua);

        if (donghuaError) {
          console.error('Error migrating donghua data:', donghuaError);
          toast({
            title: "Migration Error",
            description: `Failed to migrate donghua data: ${donghuaError.message}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Donghua Data Migrated",
            description: `Successfully migrated ${formattedDonghua.length} donghua entries`,
          });
        }
        
        // Step 2: Fetch the inserted donghua to get their IDs
        const { data: insertedDonghua } = await supabase
          .from('donghua')
          .select('id, title')
          .order('id', { ascending: true });

        // Step 3: Migrate episodes data, linking them to the correct donghua IDs
        const episodesData = JSON.parse(localStorage.getItem('episodesData') || '[]');
        if (episodesData.length > 0 && insertedDonghua) {
          const formattedEpisodes = episodesData.map((episode: any) => {
            // Match the donghua_id with the new inserted donghua records
            const donghuaIndex = parseInt(episode.donghuaId);
            const matchedDonghua = insertedDonghua[donghuaIndex];
            
            return {
              id: episode.id || `${episode.donghuaId}-${episode.episodeNumber}`,
              donghua_id: matchedDonghua?.id || 1,
              episode_number: episode.episodeNumber || 1,
              title: episode.title || `Episode ${episode.episodeNumber || 1}`,
              description: episode.description || null,
              thumbnail_url: episode.thumbnail || null,
              video_url: episode.videoUrl || null,
              duration: episode.duration || null,
              is_vip: episode.isVip || false,
              release_date: episode.releaseDate || new Date().toISOString().split('T')[0],
            };
          });

          const { error: episodesError } = await supabase
            .from('episodes')
            .insert(formattedEpisodes);

          if (episodesError) {
            console.error('Error migrating episodes data:', episodesError);
            toast({
              title: "Migration Error",
              description: `Failed to migrate episodes data: ${episodesError.message}`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Episodes Data Migrated",
              description: `Successfully migrated ${formattedEpisodes.length} episode entries`,
            });
          }
        }
      }
      
      // Migration complete
      toast({
        title: "Migration Complete",
        description: "All data has been migrated to Supabase.",
      });

    } catch (error: any) {
      console.error('Data migration error:', error);
      toast({
        title: "Migration Failed",
        description: error.message || "An unexpected error occurred during migration",
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Button 
      onClick={migrateData} 
      disabled={migrating}
      className="w-full mb-4"
      variant="outline"
    >
      {migrating ? 'Migrating...' : 'Migrate Data to Supabase'}
    </Button>
  );
}
