
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useEpisodes } from '@/hooks/useEpisodes';
import { useDonghua } from '@/hooks/useDonghua';
import { useAuth } from '@/hooks/useAuth';

const EpisodeDetail = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const episodeId = queryParams.get('id') || '';
  const donghuaId = Number(queryParams.get('donghuaId'));
  
  const [episode, setEpisode] = useState<any>(null);
  const [donghua, setDonghua] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { getEpisodeById, episodes } = useEpisodes(donghuaId);
  const { getDonghuaById } = useDonghua();
  const { user } = useAuth();

  const [nextEpisode, setNextEpisode] = useState<any>(null);
  const [prevEpisode, setPrevEpisode] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      if (episodeId) {
        const epData = await getEpisodeById(episodeId);
        setEpisode(epData);
        
        if (donghuaId && epData) {
          const dhData = await getDonghuaById(donghuaId);
          setDonghua(dhData);
        }
        
        setLoading(false);
      }
    }
    
    fetchData();
  }, [episodeId, donghuaId, getEpisodeById, getDonghuaById]);

  useEffect(() => {
    if (episode && episodes.length > 0) {
      const currentIndex = episodes.findIndex(ep => ep.id === episode.id);
      
      if (currentIndex > 0) {
        setPrevEpisode(episodes[currentIndex - 1]);
      } else {
        setPrevEpisode(null);
      }
      
      if (currentIndex < episodes.length - 1) {
        setNextEpisode(episodes[currentIndex + 1]);
      } else {
        setNextEpisode(null);
      }
    }
  }, [episode, episodes]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
          <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="flex justify-between mb-6">
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-6 w-full"></div>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Episode not found</h2>
        <p className="mb-4">The episode you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="text-blue-500 hover:underline">Back to homepage</Link>
      </div>
    );
  }

  const isVipContent = episode.is_vip;
  const hasAccess = user && user.role === 'vip' || !isVipContent;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">{donghua?.title} - {episode.title}</h1>
      
      <div className="relative bg-black rounded-lg overflow-hidden mb-6">
        <div className="aspect-w-16 aspect-h-9">
          {hasAccess ? (
            episode.video_url ? (
              <video 
                controls 
                className="w-full h-full object-contain"
                poster={episode.thumbnail_url}
              >
                <source src={episode.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                Video unavailable
              </div>
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mb-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-bold mb-2">VIP Content</h3>
              <p className="text-center mb-4">This episode is only available for VIP members</p>
              <Link to="/user" className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-colors">
                Upgrade to VIP
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mb-6">
        {prevEpisode ? (
          <Link to={`/episode?id=${prevEpisode.id}&donghuaId=${donghuaId}`} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-4 py-2 rounded transition-colors">
            ← Previous Episode
          </Link>
        ) : (
          <div></div>
        )}
        
        <Link to={`/donghua?id=${donghuaId}`} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
          Back to Series
        </Link>
        
        {nextEpisode ? (
          <Link to={`/episode?id=${nextEpisode.id}&donghuaId=${donghuaId}`} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-4 py-2 rounded transition-colors">
            Next Episode →
          </Link>
        ) : (
          <div></div>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Episode {episode.episode_number}: {episode.title}</h2>
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span>Released: {new Date(episode.release_date).toLocaleDateString()}</span>
          {episode.duration && <span>Duration: {Math.floor(episode.duration / 60)}m {episode.duration % 60}s</span>}
          {isVipContent && <span className="text-yellow-500 font-semibold">VIP</span>}
        </div>
        {episode.description && (
          <p className="text-gray-600 dark:text-gray-300">{episode.description}</p>
        )}
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">More Episodes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {episodes.slice(0, 6).map((ep) => (
            <Link 
              key={ep.id}
              to={`/episode?id=${ep.id}&donghuaId=${donghuaId}`} 
              className={`block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow ${ep.id === episodeId ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-300 dark:bg-gray-700">
                {ep.thumbnail_url ? (
                  <img src={ep.thumbnail_url} alt={ep.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-700 text-gray-500">
                    <span>No Image</span>
                  </div>
                )}
                {ep.is_vip && (
                  <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded">VIP</div>
                )}
              </div>
              <div className="p-2">
                <div className="text-sm font-medium">Episode {ep.episode_number}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{ep.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EpisodeDetail;
