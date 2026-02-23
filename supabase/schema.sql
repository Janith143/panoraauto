-- Supabase Schema for AutoLog & Garage Connect

-- 1. Owners
CREATE TABLE IF NOT EXISTS owners (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Owner Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    plate TEXT UNIQUE NOT NULL,
    vin TEXT,
    engine_type TEXT,
    current_odo INTEGER DEFAULT 0,
    revenue_license_date DATE,
    insurance_date DATE,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Garages
CREATE TABLE IF NOT EXISTS garages (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    owner_email TEXT UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Garage Customers (Isolated to the Garage)
CREATE TABLE IF NOT EXISTS garage_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garage_id UUID REFERENCES garages(id) ON DELETE CASCADE,
    plate TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    phone TEXT,
    owner_name TEXT,
    notes TEXT,
    odometer INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(garage_id, plate)
);

-- 5. Bills / Invoices (The Handshake)
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garage_id UUID REFERENCES garages(id) ON DELETE CASCADE,
    garage_customer_id UUID REFERENCES garage_customers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    plate TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    odometer INTEGER,
    notes TEXT,
    photos TEXT[],
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    source TEXT NOT NULL CHECK (source IN ('garage', 'owner')),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Service Line Items (Parts & Labor attached to a Bill)
CREATE TABLE IF NOT EXISTS service_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    lifespan_odo INTEGER,
    lifespan_months INTEGER
);

-- 7. Vehicle Parts (For health tracking inside Owner App)
CREATE TABLE IF NOT EXISTS vehicle_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    last_service_odo INTEGER NOT NULL DEFAULT 0,
    lifespan_odo INTEGER NOT NULL,
    last_service_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lifespan_months INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_parts ENABLE ROW LEVEL SECURITY;

-- Disable RLS for quick prototyping (Optional, but recommended for current phase)
-- We will rely on Application-level checks for now since we haven't configured RLS Policies
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE garages DISABLE ROW LEVEL SECURITY;
ALTER TABLE garage_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_parts DISABLE ROW LEVEL SECURITY;
