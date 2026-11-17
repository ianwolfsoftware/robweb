-- Migration 002: non-personal initial page/settings records. Review only; not applied.
INSERT INTO settings (setting_key, value_json) VALUES
  ('form_retention_days', '90'),
  ('app_store_url', 'null'),
  ('play_store_url', 'null'),
  ('web_app_url', 'null')
ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);

INSERT INTO pages (id, slug, title) VALUES
  (UUID(), '/', 'Home'),
  (UUID(), '/app/', 'RC Calculators'),
  (UUID(), '/shop/', 'Shop'),
  (UUID(), '/videos/', 'Videos'),
  (UUID(), '/about/', 'About'),
  (UUID(), '/services/', 'Services'),
  (UUID(), '/projects/', 'Projects'),
  (UUID(), '/robin-recommends/', 'Robin Recommends'),
  (UUID(), '/contact/', 'Contact'),
  (UUID(), '/register-interest/', 'Register your interest')
ON DUPLICATE KEY UPDATE title = VALUES(title);
