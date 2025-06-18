-- Drop the existing schedules table and recreate with simpler structure
DROP TABLE IF EXISTS public.schedules CASCADE;

-- Create a simple user_data table - one record per user
CREATE TABLE public.user_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
    next_color_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Create policies - users can only access their own data
CREATE POLICY "Users can view own data" ON public.user_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON public.user_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON public.user_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON public.user_data
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_user_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER on_user_data_updated
    BEFORE UPDATE ON public.user_data
    FOR EACH ROW EXECUTE PROCEDURE public.handle_user_data_updated_at();

-- Create index for better performance
CREATE INDEX user_data_user_id_idx ON public.user_data(user_id);

SELECT 'Simplified database schema created successfully' as status;
