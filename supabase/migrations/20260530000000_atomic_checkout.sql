-- Migration: Atomic Checkout & Inventory Decrement
-- Ensures robust transactional integrity. If stock is insufficient, the transaction aborts.

CREATE OR REPLACE FUNCTION confirm_order_and_decrement_inventory(p_order_id UUID)
RETURNS void AS $$
DECLARE
    v_order_status TEXT;
    item RECORD;
    v_current_stock INT;
BEGIN
    -- 1. Lock the order row and check status (Idempotency)
    SELECT status INTO v_order_status
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    IF v_order_status = 'Confirmed' THEN
        -- Already processed, return silently
        RETURN;
    END IF;

    -- 2. Decrement inventory for all items
    FOR item IN 
        SELECT product_id, quantity 
        FROM order_items 
        WHERE order_id = p_order_id
    LOOP
        -- Lock the product row
        SELECT stock_quantity INTO v_current_stock
        FROM products
        WHERE id = item.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found', item.product_id;
        END IF;

        IF v_current_stock < item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %. Requested: %, Available: %', item.product_id, item.quantity, v_current_stock;
        END IF;

        -- Decrement stock
        UPDATE products
        SET stock_quantity = stock_quantity - item.quantity
        WHERE id = item.product_id;
    END LOOP;

    -- 3. Update Order Status
    UPDATE orders
    SET 
        status = 'Confirmed',
        payment_status = 'Paid',
        approval_status = 'Approved'
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
