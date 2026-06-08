-- Tighten commerce Data API table grants after schema-level default privileges.
-- Public users only need direct table access to published products/prices.

REVOKE ALL ON TABLE jg_app.commerce_customers FROM anon;
REVOKE ALL ON TABLE jg_app.commerce_orders FROM anon;
REVOKE ALL ON TABLE jg_app.commerce_subscriptions FROM anon;
REVOKE ALL ON TABLE jg_app.commerce_entitlements FROM anon;
REVOKE ALL ON TABLE jg_app.commerce_webhook_events FROM anon;
REVOKE ALL ON TABLE jg_app.commerce_deliveries FROM anon;
REVOKE ALL ON TABLE jg_app.commerce_feature_usage FROM anon;

GRANT SELECT ON TABLE jg_app.commerce_products TO anon;
GRANT SELECT ON TABLE jg_app.commerce_prices TO anon;
