import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const loadDotEnv = () => {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  contents.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith("#")) return;
    const index = line.indexOf("=");
    if (index === -1) return;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

const main = async () => {
  loadDotEnv();

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in environment.",
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("stocks_raw_upload")
    .select("*")
    .order("uploaded_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("Supabase query failed:", error.message);
    process.exitCode = 1;
    return;
  }

  if (!data || data.length === 0) {
    console.log("No stock data found in stocks_raw_upload.");
    return;
  }

  console.log(`Found ${data.length} stock rows. Showing latest:`);
  console.table(data);
};

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});
