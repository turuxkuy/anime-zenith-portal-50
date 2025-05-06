
import { MigrationButton } from '@/components/MigrationButton';
import { AdminTools } from '@/components/AdminTools';
import { useAuth } from '@/hooks/useAuth';

export function DataMigration() {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className="p-4 mb-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-3">Data Migration Tools</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Use these tools to migrate data from localStorage to Supabase database.
      </p>
      
      <MigrationButton />
      <AdminTools />
    </div>
  );
}
