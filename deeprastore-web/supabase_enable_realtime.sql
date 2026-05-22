-- Enable Realtime for orders and products
-- This allows the Next.js frontend to subscribe to INSERT/UPDATE/DELETE events

begin;
  -- remove the supabase_realtime publication if it exists to reset
  drop publication if exists supabase_realtime;
  
  -- create the publication
  create publication supabase_realtime;
commit;

-- add the tables to the publication
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.products;
