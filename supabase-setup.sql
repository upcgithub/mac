-- =============================================
-- SUPABASE DATABASE SETUP SCRIPT
-- =============================================
-- This script creates the necessary tables and policies for user profiles and shipping addresses
-- Run this in your Supabase SQL Editor

-- =============================================
-- 1. CREATE PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. CREATE SHIPPING ADDRESSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.shipping_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, -- e.g., "Casa", "Oficina", "Casa de mis padres"
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'España',
  phone TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON public.shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_default ON public.shipping_addresses(user_id, is_default);

-- =============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. CREATE RLS POLICIES FOR PROFILES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- 6. CREATE RLS POLICIES FOR SHIPPING ADDRESSES
-- =============================================

-- Users can view their own shipping addresses
CREATE POLICY "Users can view own shipping addresses" ON public.shipping_addresses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own shipping addresses
CREATE POLICY "Users can insert own shipping addresses" ON public.shipping_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own shipping addresses
CREATE POLICY "Users can update own shipping addresses" ON public.shipping_addresses
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own shipping addresses
CREATE POLICY "Users can delete own shipping addresses" ON public.shipping_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 7. CREATE FUNCTION TO HANDLE NEW USER SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. CREATE TRIGGER FOR AUTOMATIC PROFILE CREATION
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 9. CREATE FUNCTION TO UPDATE UPDATED_AT TIMESTAMPS
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. CREATE TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_shipping_addresses
  BEFORE UPDATE ON public.shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 11. CREATE FUNCTION TO ENSURE ONLY ONE DEFAULT ADDRESS
-- =============================================
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this address as default, unset all other defaults for this user
  IF NEW.is_default = TRUE THEN
    UPDATE public.shipping_addresses 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 12. CREATE TRIGGER FOR DEFAULT ADDRESS CONSTRAINT
-- =============================================
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON public.shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_address();

-- =============================================
-- 13. INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =============================================
-- Uncomment the following lines if you want to add sample data for testing
-- Note: This requires you to have a test user created first

/*
-- Sample profile data (replace with actual user ID)
INSERT INTO public.profiles (id, email, full_name, phone) VALUES
('your-user-id-here', 'test@example.com', 'Usuario de Prueba', '+34 600 000 000');

-- Sample shipping address data (replace with actual user ID)
INSERT INTO public.shipping_addresses (user_id, title, first_name, last_name, address_line_1, city, state, postal_code, country, is_default) VALUES
('your-user-id-here', 'Casa', 'Juan', 'Pérez', 'Calle Mayor 123', 'Madrid', 'Madrid', '28001', 'España', true);
*/

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- Your Supabase database is now configured with:
-- ✅ Profiles table with RLS policies
-- ✅ Shipping addresses table with RLS policies
-- ✅ Automatic profile creation on user signup
-- ✅ Timestamp management
-- ✅ Default address constraints
-- ✅ Proper indexing for performance
-- ✅ Security policies to protect user data 