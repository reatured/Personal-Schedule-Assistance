-- 这个脚本用于在 Supabase 中设置 'user_data' 表。
-- 它为每个用户创建一个单独的记录，用于存储他们所有的日程数据（项目、日程安排、下一个颜色索引以及客户端管理的时间戳）。
-- This script sets up the 'user_data' table in Supabase.
-- It creates a single record per user to store all their schedule data (projects, schedule, next color index, and client-managed timestamps).

-- 如果存在旧的 'user_data' 表，则删除它，以确保新结构的干净状态
-- Drop the old user_data table if it exists to ensure a clean slate for the new structure
DROP TABLE IF EXISTS public.user_data CASCADE;
-- 如果存在先前迭代中的旧 'schedules' 表，则删除它
-- Drop the old schedules table if it exists from previous iterations
DROP TABLE IF EXISTS public.schedules CASCADE;

-- 创建一个简单的 user_data 表 - 每个用户一条记录
-- 时间戳 (createdAt, updatedAt) 将在客户端管理并存储在 'data' JSONB 字段中。
-- Create a simple user_data table - one record per user
-- Timestamps (createdAt, updatedAt) will be managed on the client and stored within the 'data' JSONB field.
CREATE TABLE IF NOT EXISTS public.user_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- 这个 'data' 字段将包含整个日程包，包括项目、日程、nextColorIndex 和客户端管理的时间戳
    -- This 'data' field will hold the entire schedule bundle including projects, schedule, nextColorIndex, and client-managed timestamps
    data JSONB NOT NULL DEFAULT jsonb_build_object(
        'projects', '[]'::jsonb,
        'schedule', '{}'::jsonb,
        'nextColorIndex', 0,
        'createdAt', NULL, -- 将由客户端在首次保存时设置 (Will be set by client on first save)
        'updatedAt', NULL  -- 将由客户端在每次保存时设置 (Will be set by client on every save)
    )
    -- 不需要单独的 SQL created_at/updated_at 列或触发器
    -- No separate created_at/updated_at SQL columns or triggers needed
);

-- 启用行级安全 (RLS)
-- Enable Row Level Security (RLS)
-- RLS 是一种数据库安全功能，允许你定义策略来控制哪些用户可以访问或修改表中的哪些行。
-- RLS is a database security feature allowing you to define policies controlling which users can access or modify which rows in a table.
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- 如果存在现有策略，则删除它们（以避免在重新运行时发生冲突）
-- Drop existing policies if they exist (to avoid conflicts during re-runs)
DROP POLICY IF EXISTS "Users can view own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can update own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can delete own data" ON public.user_data;

-- 创建策略 - 用户只能访问自己的数据
-- Create policies - users can only access their own data
CREATE POLICY "Users can view own data" ON public.user_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON public.user_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON public.user_data
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户可以删除自己的数据（例如，用于账户删除）
-- Users can delete their own data (e.g., for account deletion)
CREATE POLICY "Users can delete own data" ON public.user_data
    FOR DELETE USING (auth.uid() = user_id);

-- 为提高性能创建索引
-- Create index for better performance
DROP INDEX IF EXISTS user_data_user_id_idx;
CREATE INDEX user_data_user_id_idx ON public.user_data(user_id);

SELECT 'User_data table setup complete (client-managed timestamps).' as status;
