-- Drop the old schedules table if it exists
DROP TABLE IF EXISTS public.schedules CASCADE;

-- Create a simple user_data table - one record per user
CREATE TABLE IF NOT EXISTS public.user_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
    next_color_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts during re-runs)
DROP POLICY IF EXISTS "Users can view own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can update own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can delete own data" ON public.user_data; -- Though delete might not be used directly by app

-- Create policies - users can only access their own data
CREATE POLICY "Users can view own data" ON public.user_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON public.user_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON public.user_data
    FOR UPDATE USING (auth.uid() = user_id);

-- Optional: Allow users to delete their data if needed (e.g., account deletion)
CREATE POLICY "Users can delete own data" ON public.user_data
    FOR DELETE USING (auth.uid() = user_id);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_user_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_data_updated ON public.user_data;

-- Create trigger to automatically update updated_at
CREATE TRIGGER on_user_data_updated
    BEFORE UPDATE ON public.user_data
    FOR EACH ROW EXECUTE PROCEDURE public.handle_user_data_updated_at();

-- Create index for better performance
DROP INDEX IF EXISTS user_data_user_id_idx;
CREATE INDEX user_data_user_id_idx ON public.user_data(user_id);

SELECT 'User_data table setup complete.' as status;
