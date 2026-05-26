-- C:\Users\rodda\OneDrive\Documents\New project 2\deeprastore-web\supabase\migrations\20260526000003_cms_seed_data.sql
-- Deeprastore CMS Seed Data — all tables populated with real boutique content
-- Uses INSERT ... ON CONFLICT DO NOTHING so this migration is idempotent

-- ============================================================
-- 1. tracking_messages
-- ============================================================

INSERT INTO public.tracking_messages (stage_key, label, description, reassurance_notice, sort_order)
VALUES
  (
    'confirmed',
    'Order Confirmed',
    'Your order has been received and logged in our system. Our boutique team will begin the fulfilment process within 1 business day.',
    NULL,
    1
  ),
  (
    'sourcing',
    'Fabric Sourcing',
    'We are identifying and procuring the finest fabric for your garment from our curated network of heritage weavers.',
    'Your fabric is being sourced directly from heritage weavers. This careful selection ensures colour fidelity and tensile strength that mass-produced alternatives cannot match.',
    2
  ),
  (
    'inspection',
    'Fabric Inspection',
    'The fabric has arrived at our atelier and is undergoing thorough quality inspection before cutting begins.',
    'Our material specialists are checking every inch for yarn consistency, dye uniformity, and weave alignment.',
    3
  ),
  (
    'tailoring_started',
    'Tailoring Started',
    'Your garment pattern has been drafted and the Master Tailor has commenced work on your bespoke piece.',
    'Your assigned Master Tailor has begun pattern drafting on a bespoke canvas.',
    4
  ),
  (
    'stitching',
    'Stitching In Progress',
    'The garment is actively being stitched by our artisan team. Each seam is carefully executed for perfect tension and drape.',
    'Artisan hand-stitching is underway. This phase requires careful tension control for perfect drape.',
    5
  ),
  (
    'qc',
    'Quality Check',
    'Your completed garment is undergoing our rigorous multi-point quality inspection before it is approved for dispatch.',
    'Your garment is on final mannequin verification — seam checks, measurement confirmation, and finish testing.',
    6
  ),
  (
    'packing',
    'Packing',
    'Your garment has passed quality inspection and is being prepared for shipment in our signature packaging.',
    'Being hand-pressed and wrapped in acid-free tissue before signature packaging.',
    7
  ),
  (
    'dispatch',
    'Dispatch',
    'Your order has been handed to our courier partner and is on its way to you. You will receive a tracking number shortly.',
    NULL,
    8
  ),
  (
    'out_for_delivery',
    'Out For Delivery',
    'Your order is with the local delivery team and will arrive today. Please ensure someone is available to receive the package.',
    NULL,
    9
  ),
  (
    'delivered',
    'Delivered',
    'Your Deeprastore order has been delivered. We hope you are delighted with your curation. For any fitting adjustments, please visit your account.',
    NULL,
    10
  )
ON CONFLICT (stage_key) DO NOTHING;


-- ============================================================
-- 2. support_templates
-- ============================================================

INSERT INTO public.support_templates (category_id, title, description, intent_message, badge, badge_color, sort_order)
VALUES
  (
    'order_status',
    'Order Status',
    'Track your live order, verify estimated delivery date, or request a progress update from our team.',
    'Hi! I would like to check the status of my order.',
    NULL,
    NULL,
    1
  ),
  (
    'fitting_adjustment',
    'Fitting & Alteration',
    'Request a fitting adjustment or alteration for a customized item. Our Master Tailors will ensure the perfect fit.',
    'Hi! I need to request a fitting adjustment for my customized order.',
    'Adjustment-First',
    '#D4AF37',
    2
  ),
  (
    'fabric_quality',
    'Fabric or Quality Issue',
    'Report a fabric defect or quality concern with your received item. We will investigate and resolve promptly.',
    'Hi! I have a quality concern with my order.',
    'Priority',
    '#C0392B',
    3
  ),
  (
    'replacement',
    'Product Replacement',
    'Request a replacement for a ready-made item that does not meet your expectations. Subject to our returns policy.',
    'Hi! I would like to request a replacement for my order.',
    NULL,
    NULL,
    4
  ),
  (
    'delivery_delayed',
    'Delivery Concern',
    'Report a delay or courier issue with your delivery. Our concierge team will liaise with the courier on your behalf.',
    'Hi! My delivery appears delayed. Order reference:',
    NULL,
    NULL,
    5
  ),
  (
    'wedding_urgent',
    'Wedding / Urgent Order',
    'Flag a time-sensitive bridal or event order. Our team will escalate your order to priority fulfilment status immediately.',
    'Hi! I have an URGENT wedding order that needs immediate attention.',
    'Urgent',
    '#8B0000',
    6
  ),
  (
    'fabric_enquiry',
    'Fabric Enquiry',
    'Ask about specific fabric types, availability, sourcing regions, or custom fabric requests for your order.',
    'Hi! I have a question about fabric selection.',
    NULL,
    NULL,
    7
  ),
  (
    'general',
    'General Enquiry',
    'Any other question for our boutique team. We are happy to assist with anything not covered above.',
    'Hi! I have a general enquiry.',
    NULL,
    NULL,
    8
  )
ON CONFLICT (category_id) DO NOTHING;


-- ============================================================
-- 3. policy_content
-- ============================================================

INSERT INTO public.policy_content (policy_key, title, content, settings)
VALUES
  (
    'fitting_alterations',
    'Fitting Alteration Policy',
    'Customized garments are handled exclusively through our Fitting Alteration workflow. We do not offer direct refunds for custom-stitched items. Our Master Tailors will correct any fit issues within 60 days of delivery. To initiate an alteration request, please visit your account dashboard or contact our concierge via WhatsApp. Alterations are carried out at our atelier and the garment will be returned to you within 7–10 business days of receipt.',
    '{"window_days": 60}'::jsonb
  ),
  (
    'returns_window',
    'Returns & Replacements',
    'Ready-made items may be returned or replaced within 60 days of delivery. Items showing signs of use, washing, or alteration are not eligible. Replacements are dispatched within 5 business days of approval. To initiate a return, contact our support team with your order reference and a description of the issue. Our team will arrange a reverse pickup where applicable.',
    '{"window_days": 60}'::jsonb
  ),
  (
    'refund_policy',
    'Refund Policy',
    'Refunds are issued only in exceptional circumstances after all adjustment and replacement options have been exhausted. Refund eligibility must be approved by our boutique manager and is only visible in your dashboard when authorised. Approved refunds are processed to the original payment method within 7–10 business days. Deeprastore reserves the right to assess each case on its individual merits.',
    '{}'::jsonb
  ),
  (
    'delay_notice',
    'Delivery Delay Notice',
    'Custom tailoring timelines vary based on fabric availability and complexity. Our standard custom timeline is 12–18 business days from the date of order confirmation. We communicate proactively at every stage of the tailoring process via WhatsApp notifications. Contact our concierge if your order exceeds 25 business days. We will investigate immediately and provide a revised timeline with a goodwill gesture where warranted.',
    '{"standard_days": 18, "escalation_days": 25}'::jsonb
  )
ON CONFLICT (policy_key) DO NOTHING;


-- ============================================================
-- 4. site_settings
-- ============================================================

INSERT INTO public.site_settings (key, value)
VALUES
  (
    'store_name',
    '{"text": "Deeprastore"}'::jsonb
  ),
  (
    'store_tagline',
    '{"text": "Artisan Indian Boutique"}'::jsonb
  ),
  (
    'whatsapp_number',
    '{"number": "+919999999999"}'::jsonb
  ),
  (
    'currency',
    '{"code": "INR", "symbol": "₹"}'::jsonb
  ),
  (
    'announcement_bar',
    '{"text": "Free domestic shipping on orders above ₹5,000. Custom tailoring: 12–18 business days.", "active": true}'::jsonb
  ),
  (
    'support_hours',
    '{"text": "Mon–Sat, 10am–7pm IST"}'::jsonb
  )
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- 5. notification_templates
-- ============================================================

INSERT INTO public.notification_templates (trigger_event, channel, body)
VALUES
  (
    'order_confirmed',
    'WhatsApp',
    'Hi {customer_name}! Your Deeprastore order #{order_id} has been confirmed. We will begin fabric sourcing within 1 business day. Track: https://deeprastore.com/track/{order_id}'
  ),
  (
    'dispatch_alert',
    'WhatsApp',
    'Great news, {customer_name}! Your order #{order_id} has been dispatched. Estimated delivery: {estimated_date}. Track your order: https://deeprastore.com/track/{order_id}'
  ),
  (
    'delay_alert',
    'WhatsApp',
    'Hello {customer_name}, we wanted to personally update you: your order #{order_id} is taking a little longer than usual due to our quality standards. New estimate: {new_date}. We appreciate your patience.'
  ),
  (
    'delivery_confirmed',
    'WhatsApp',
    'Your order #{order_id} has been delivered! We hope you love your curation. For fitting adjustments, visit: https://deeprastore.com/account'
  )
ON CONFLICT (trigger_event) DO NOTHING;


-- ============================================================
-- 6. navigation_manager
-- ============================================================

INSERT INTO public.navigation_manager (menu_type, items, spacing, padding)
VALUES
  (
    'header',
    '[
      {"label": "Collections", "url": "/collections"},
      {"label": "Custom Stitching", "url": "/custom-stitching"},
      {"label": "Lookbook", "url": "/lookbook"},
      {"label": "Track Order", "url": "/track"},
      {"label": "Support", "url": "/support"}
    ]'::jsonb,
    'gap-6',
    'py-4'
  ),
  (
    'footer_links',
    '[
      {"label": "Privacy Policy", "url": "/c/privacy"},
      {"label": "Terms of Service", "url": "/c/terms"},
      {"label": "Refund Policy", "url": "/c/refund"},
      {"label": "Track Order", "url": "/track"}
    ]'::jsonb,
    'gap-4',
    'py-3'
  )
ON CONFLICT DO NOTHING;


-- ============================================================
-- 7. footer_manager
-- ============================================================

INSERT INTO public.footer_manager (copyright_text, social_links, legal_links)
VALUES
  (
    '© 2026 Deeprastore. All Rights Reserved. Handcrafted in India.',
    '{"whatsapp": "https://wa.me/919999999999", "instagram": "https://instagram.com/deeprastore"}'::jsonb,
    '[{"label": "Privacy", "url": "/c/privacy"}, {"label": "Terms", "url": "/c/terms"}]'::jsonb
  )
ON CONFLICT DO NOTHING;
