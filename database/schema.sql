-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    tags TEXT[],
    ai_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OKRs (Objectives and Key Results) table
CREATE TABLE IF NOT EXISTS okrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    objective TEXT NOT NULL,
    key_results JSONB NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    progress DECIMAL(5,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task-OKR relationships
CREATE TABLE IF NOT EXISTS task_okrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    okr_id UUID NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, okr_id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    sent_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    ai_generated_description BOOLEAN DEFAULT false,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    unit TEXT,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task_plan', 'weekly_review', 'smart_suggestion', 'okr_improvement', 'metric_analysis')),
    content TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    is_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring tasks table
CREATE TABLE IF NOT EXISTS recurring_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    rrule TEXT NOT NULL, -- iCalendar RRULE format
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    estimated_hours DECIMAL(5,2),
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_generated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business context table (for AI analysis)
CREATE TABLE IF NOT EXISTS business_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL CHECK (context_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
    data JSONB NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON okrs(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics(date);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_user_id ON recurring_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_business_context_user_id ON business_context(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON okrs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_tasks_updated_at BEFORE UPDATE ON recurring_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own okrs" ON okrs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own invoices" ON invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own metrics" ON metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ai suggestions" ON ai_suggestions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recurring tasks" ON recurring_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own business context" ON business_context FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Insert sample data for testing
INSERT INTO users (id, email, full_name, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000001', 'demo@autopilotcoo.com', 'Demo User', 'pro')
ON CONFLICT (id) DO NOTHING;

-- Sample OKR
INSERT INTO okrs (id, user_id, title, description, objective, key_results, start_date, end_date) VALUES 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Increase Revenue', 'Focus on revenue growth this quarter', 'Increase monthly recurring revenue by 25%', 
'[{"key_result": "Acquire 50 new customers", "target": 50, "current": 15}, {"key_result": "Increase average deal size by 15%", "target": 15, "current": 8}, {"key_result": "Reduce churn rate to below 5%", "target": 5, "current": 7}]',
'2024-01-01', '2024-03-31')
ON CONFLICT (id) DO NOTHING;

-- Sample tasks
INSERT INTO tasks (id, user_id, title, description, status, priority, due_date) VALUES 
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Review customer feedback', 'Analyze recent customer feedback and identify improvement opportunities', 'pending', 'high', NOW() + INTERVAL '2 days'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Update pricing strategy', 'Review and optimize pricing for better conversion', 'in_progress', 'medium', NOW() + INTERVAL '5 days'),
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'Prepare Q1 review', 'Create comprehensive Q1 business review presentation', 'pending', 'high', NOW() + INTERVAL '1 week')
ON CONFLICT (id) DO NOTHING;

-- Sample metrics
INSERT INTO metrics (id, user_id, name, value, unit, category, date) VALUES 
('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'Monthly Recurring Revenue', 15000, 'USD', 'revenue', CURRENT_DATE),
('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', 'Customer Acquisition Cost', 150, 'USD', 'marketing', CURRENT_DATE),
('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000001', 'Customer Churn Rate', 7.2, 'percent', 'retention', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING; 