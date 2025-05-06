
import React from 'react';
import { Navigate } from 'react-router-dom';
import { DataMigration } from '@/components/DataMigration';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { useDonghua } from '@/hooks/useDonghua';
import { useEpisodes } from '@/hooks/useEpisodes';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const { profiles } = useProfiles();
  const { donghuaList } = useDonghua();
  const { episodes } = useEpisodes();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <div className="mb-8">
        <DataMigration />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {profiles.length}
          </div>
          <p className="text-gray-600 dark:text-gray-400">Total registered users</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">Donghua</h2>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {donghuaList.length}
          </div>
          <p className="text-gray-600 dark:text-gray-400">Total donghua series</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">Episodes</h2>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {episodes.length}
          </div>
          <p className="text-gray-600 dark:text-gray-400">Total episodes available</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-2 px-4">Username</th>
                <th className="text-left py-2 px-4">Email</th>
                <th className="text-left py-2 px-4">Role</th>
                <th className="text-left py-2 px-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles.slice(0, 5).map((profile) => (
                <tr key={profile.id} className="border-b dark:border-gray-700">
                  <td className="py-2 px-4">{profile.username}</td>
                  <td className="py-2 px-4">{profile.email}</td>
                  <td className="py-2 px-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      profile.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                      profile.role === 'vip' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span>Database Connection</span>
              <span className="text-green-500">Online</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span>Storage</span>
              <span className="text-green-500">75% Available</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span>API Status</span>
              <span className="text-green-500">Operational</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
