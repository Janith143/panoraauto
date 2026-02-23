import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    "https://aaogpfiqdkyhawihttvj.supabase.co",
    "sb_publishable_dAyveR3QfKal4ewWsYbTkg_190EVqEM"
);

async function test() {
    const { data, error } = await supabase
        .from('vehicles')
        .insert([{
            owner_id: "00000000-0000-0000-0000-000000000000",
            make: "Test",
            model: "Test",
            year: 2020,
            plate: "TEST" + Date.now(),
            current_odo: 1000
        }])
        .select();

    console.log("Error details:", {
        isErrorObject: error ? (error instanceof Error) : false,
        typeStr: error ? Object.prototype.toString.call(error) : null,
        keys: error ? Object.keys(error) : [],
        errorString: error ? error.toString() : null,
        json: error ? JSON.stringify(error) : null,
        error
    });
}

test();
