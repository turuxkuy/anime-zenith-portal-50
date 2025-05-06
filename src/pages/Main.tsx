
import React from 'react';
import { Link } from 'react-router-dom';
import { useDonghua } from '@/hooks/useDonghua';

const Main = () => {
  const { donghuaList, loading } = useDonghua();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Zenith Donghua</h1>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-72 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {donghuaList.length > 0 ? (
            donghuaList.map((donghua) => (
              <Link 
                to={`/donghua?id=${donghua.id}`} 
                key={donghua.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gray-300 dark:bg-gray-700 relative">
                  {donghua.poster_url ? (
                    <img 
                      src={donghua.poster_url} 
                      alt={donghua.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-300 dark:bg-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-yellow-500 px-2 py-1 rounded-full text-xs font-bold">
                    {donghua.rating}/10
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{donghua.title}</h3>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{donghua.year}</span>
                    <span>{donghua.status}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <h3 className="text-xl font-semibold mb-2">No donghua available</h3>
              <p className="text-gray-600 dark:text-gray-400">Check back later for new content</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Main;
