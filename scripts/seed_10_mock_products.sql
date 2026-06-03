-- Seed 10 Mock Products for Phase 1 Validation
-- This script safely injects 10 test products using the is_test_data flag.

INSERT INTO public.products (
    title, slug, description, price, sku, category, status, images, is_test_data, stock_quantity
) VALUES 
(
    'Mock Silk Kurta - Midnight Blue',
    'mock-silk-kurta-midnight-blue',
    'A luxurious mock silk kurta for testing checkout flows.', 
    4999.00, 
    'MOCK-KURTA-01', 
    'Kurtas', 
    'Active', 
    '{"https://via.placeholder.com/800x1000?text=Mock+Kurta+1"}', 
    true, 
    100
),
(
    'Mock Embellished Lehenga', 
    'mock-embellished-lehenga',
    'Hand-stitched mock lehenga for performance validation.', 
    14500.00, 
    'MOCK-LEHENGA-01', 
    'Lehengas', 
    'Active', 
    '{"https://via.placeholder.com/800x1000?text=Mock+Lehenga+1"}', 
    true, 
    50
),
(
    'Mock Banarasi Saree', 
    'mock-banarasi-saree',
    'Premium mock saree for verifying cart integrations.', 
    8999.00, 
    'MOCK-SAREE-01', 
    'Sarees', 
    'Active', 
    '{"https://via.placeholder.com/800x1000?text=Mock+Saree+1"}', 
    true, 
    25
),
(
    'Mock Velvet Dupatta', 
    'mock-velvet-dupatta',
    'Heavy mock dupatta for testing accessory pricing.', 
    2999.00, 
    'MOCK-DUPATTA-01', 
    'Dupattas', 
    'Active', 
    '{"https://via.placeholder.com/800x1000?text=Mock+Dupatta+1"}', 
    true, 
    200
),
(
    'Mock Designer Suit Set', 
    'mock-designer-suit-set',
    'Three-piece mock suit for validation of complex orders.', 
    6500.00, 
    'MOCK-SUIT-01', 
    'Suits', 
    'Active', 
    '{"https://via.placeholder.com/800x1000?text=Mock+Suit+1"}', 
    true, 
    75
),
(
    'Mock Bridal Gown', 
    'mock-bridal-gown',
    'High-value mock gown for testing large Razorpay transactions.', 
    25000.00, 
    'MOCK-GOWN-01', 
    'Bridal', 
    'Active', 
    '{"https://via.placeholder.com/800x1000?text=Mock+Bridal+Gown+1"}', 
    true, 
    10
),
(
    'Mock Georgette Anarkali', 
    'mock-georgette-anarkali',
    'Flowing mock anarkali for category testing.', 
    5500.00, 
    'MOCK-ANARKALI-01', 
    'Anarkalis', 
    'Active', 
    '{"https://via.placeholder.com/800x1000?text=Mock+Anarkali+1"}', 
    true, 
    40
),
(
    'Mock Chanderi Tunic', 
    'mock-chanderi-tunic',
    'Lightweight mock tunic for testing low inventory triggers.', 
    1999.00, 
    'MOCK-TUNIC-01', 
    'Tunics', 
    'Active', 
    '{"https://via.placeholder.com/800x1000?text=Mock+Tunic+1"}', 
    true, 
    5
),
(
    'Mock Embroidered Blouse', 
    'mock-embroidered-blouse',
    'Customizable mock blouse for measurement testing.', 
    3500.00, 
    'MOCK-BLOUSE-01', 
    'Blouses', 
    'Active', 
    '{"https://via.placeholder.com/800x1000?text=Mock+Blouse+1"}', 
    true, 
    150
),
(
    'Mock Organza Saree', 
    'mock-organza-saree',
    'Delicate mock saree for wishlist validation.', 
    12000.00, 
    'MOCK-SAREE-02', 
    'Sarees', 
    'Active', 
    '{"https://via.placeholder.com/800x1000?text=Mock+Saree+2"}', 
    true, 
    30
);
