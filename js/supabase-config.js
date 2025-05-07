
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
  
  createBucket: async (bucketName, isPublic = true) => {
    try {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: isPublic
      });
      
      if (error) {
        // If bucket already exists, this is not an error we need to report
        if (error.message && error.message.includes("already exists")) {
          console.log(`Bucket ${bucketName} already exists`);
          return { data: { name: bucketName }, error: null };
        }
        throw error;
      }
      
      return { data, error: null };
    } catch (err) {
      console.error(`Create bucket error (${bucketName}):`, err);
      return { data: null, error: err };
    }
  }
};

// Check if storage buckets exist and create them if they don't
async function ensureStorageBuckets() {
  const requiredBuckets = ['posters', 'backdrops', 'thumbnails', 'videos'];
  
  try {
    console.log("Checking storage buckets...");
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Failed to list buckets:", error);
      return;
    }
    
    console.log("Existing buckets:", buckets.map(b => b.name).join(", ") || "none");
    const existingBuckets = buckets ? buckets.map(bucket => bucket.name) : [];
    
    for (const bucket of requiredBuckets) {
      if (!existingBuckets.includes(bucket)) {
        console.log(`Creating bucket: ${bucket}`);
        const { error: createError } = await supabaseStorage.createBucket(bucket);
        
        if (createError) {
          console.error(`Failed to create bucket ${bucket}:`, createError);
        } else {
          console.log(`Successfully created bucket: ${bucket}`);
        }
      } else {
        console.log(`Bucket ${bucket} already exists`);
      }
    }
    
    console.log("All required storage buckets are checked");
  } catch (err) {
    console.error("Error checking/creating storage buckets:", err);
  }
}

// Call this function when the page loads to ensure buckets exist
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  // Only check buckets on admin page or when needed
  if (currentPath.includes('admin.html')) {
    console.log("Admin page detected, checking storage buckets");
    ensureStorageBuckets();
  }
});
