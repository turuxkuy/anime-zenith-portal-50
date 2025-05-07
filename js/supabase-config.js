
const SUPABASE_URL = "https://eguwfitbjuzzwbgalwcx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndXdmaXRianV6endiZ2Fsd2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDQ4OTgsImV4cCI6MjA2MjEyMDg5OH0.nYgvViJgO67L5nNYEejoW5KajcXlryTThTzA1bvUO9k";

// Initialize the Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage helper
const supabaseStorage = {
  uploadFile: async (bucket, path, file) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      const publicURL = supabase.storage.from(bucket).getPublicUrl(data.path);
      
      return {
        data: {
          publicUrl: publicURL.data.publicUrl
        },
        error: null
      };
    } catch (err) {
      console.error("Storage upload error:", err);
      return {
        data: null,
        error: err
      };
    }
  },
  
  deleteFile: async (bucket, path) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (err) {
      console.error("Storage delete error:", err);
      return { data: null, error: err };
    }
  },
  
  createBucket: async (bucketName) => {
    try {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (err) {
      console.error("Create bucket error:", err);
      return { data: null, error: err };
    }
  }
};

// Check if storage buckets exist and create them if they don't
async function ensureStorageBuckets() {
  const requiredBuckets = ['posters', 'backdrops', 'thumbnails', 'videos'];
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) throw error;
    
    const existingBuckets = buckets.map(bucket => bucket.name);
    
    for (const bucket of requiredBuckets) {
      if (!existingBuckets.includes(bucket)) {
        console.log(`Creating bucket: ${bucket}`);
        await supabaseStorage.createBucket(bucket);
      }
    }
    
    console.log("All required storage buckets are ready");
  } catch (err) {
    console.error("Error checking/creating storage buckets:", err);
  }
}

// Call this function when the admin page loads
document.addEventListener('DOMContentLoaded', ensureStorageBuckets);
