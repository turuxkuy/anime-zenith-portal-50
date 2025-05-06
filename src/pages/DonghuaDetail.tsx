
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useDonghua } from '@/hooks/useDonghua';
import { useEpisodes } from '@/hooks/useEpisodes';

const DonghuaDetail = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const donghuaId = Number(queryParams.get('id'));
  
  const [donghua, setDonghua] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { getDonghuaById } = useDonghua();
  const { episodes, loading: loadingEpisodes } = useEpisodes(donghuaId);

  useEffect(() => {
    async function fetchDonghua() {
      if (donghuaId) {
        const data = await getDonghuaById(donghuaId);
        setDonghua(data);
        setLoading(false);
      }
    }
    
    fetchDonghua();
  }, [donghuaId, getDonghuaById]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-6 w-1/3"></div>
          <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  if (!donghua) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Donghua not found</h2>
        <p className="mb-4">The donghua you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="text-blue-500 hover:underline">Back to homepage</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative mb-8">
        {donghua.backdrop_url ? (
          <div className="h-64 md:h-80 rounded-lg overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center rounded-lg"
              style={{ 
                backgroundImage: `url(${donghua.backdrop_url})`,
                filter: 'blur(2px)',
                transform: 'scale(1.03)'
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg" />
          </div>
        ) : (
          <div className="h-64 md:h-80 rounded-lg overflow-hidden bg-gray-800"></div>
        )}
        
        <div className="container mx-auto px-4 absolute inset-0 flex items-end md:items-center">
          <div className="flex flex-col md:flex-row gap-6 w-full">
            <div className="w-32 h-48 md:w-48 md:h-72 rounded-lg overflow-hidden shadow-lg flex-shrink-0 bg-gray-700">
              {donghua.poster_url ? (
                <img src={donghua.poster_url} alt={donghua.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-500">
                  No Image
                </div>
              )}
            </div>
            <div className="text-white flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{donghua.title}</h1>
              <div className="flex gap-4 mb-3 text-sm">
                <span>{donghua.year}</span>
                <span>{donghua.genre}</span>
                <span className={donghua.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'}>
                  {donghua.status}
                </span>
              </div>
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 font-semibold">{donghua.rating}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Synopsis</h2>
        <p className="text-gray-600 dark:text-gray-300">{donghua.synopsis}</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Episodes</h2>
        
        {loadingEpisodes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 dark:bg-gray-800 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {episodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {episodes.map((episode) => (
                  <Link 
                    key={episode.id}
                    to={`/episode?id=${episode.id}&donghuaId=${donghua.id}`} 
                    className="flex bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow"
                  >
                    <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 flex-shrink-0">
                      {episode.thumbnail_url ? (
                        <img src={episode.thumbnail_url} alt={episode.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-700 text-gray-500">
                          <span>No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium">Episode {episode.episode_number}</h3>
                        {episode.is_vip && (
                          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">VIP</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{episode.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h3 className="text-xl font-medium mb-2">No episodes available yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Check back later for updates</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DonghuaDetail;
