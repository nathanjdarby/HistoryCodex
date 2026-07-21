import { ensureStorageBucket, getSupabaseUrl, isSupabaseStorageEnabled } from "@/lib/server/supabase-storage";

async function main() {
  if (!isSupabaseStorageEnabled()) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before setting up storage.");
  }

  const { bucket, created } = await ensureStorageBucket();
  const base = getSupabaseUrl();

  console.log(created ? `Created public bucket "${bucket}".` : `Bucket "${bucket}" already exists.`);
  console.log(`Public object URL base: ${base}/storage/v1/object/public/${bucket}/`);
  console.log("Next step: npm run uploads:migrate");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
