-- Migration: Inventory RPC
-- Adds an RPC to safely decrement inventory quantity concurrently.

CREATE OR REPLACE FUNCTION decrement_product_inventory(p_product_id UUID, p_quantity INT)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET inventory_quantity = GREATEST(0, COALESCE(inventory_quantity, 0) - p_quantity)
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
