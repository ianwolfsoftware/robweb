-- Migration 003: media controls, partners and the two final enquiry types.
-- Review only. Do not run through build/start; Ian/Paul applies this separately.

ALTER TABLE form_submissions
  MODIFY type ENUM('contact','interest','media','cladding') NOT NULL;

CREATE TABLE content_controls (
  item_kind ENUM('youtube','episode','interview','press','partner','product') NOT NULL,
  item_key VARCHAR(255) NOT NULL,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  position INT UNSIGNED NULL,
  updated_by CHAR(36) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (item_kind, item_key),
  KEY ix_content_controls_order (item_kind, pinned, position),
  CONSTRAINT fk_content_controls_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE partners (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  url VARCHAR(500) NOT NULL,
  logo_path VARCHAR(255) NULL,
  evidence_url VARCHAR(500) NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_partners_public (active, position),
  CONSTRAINT fk_partners_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT ck_partners_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  CONSTRAINT ck_partners_url CHECK (url LIKE 'https://%'),
  CONSTRAINT ck_partners_evidence CHECK (evidence_url LIKE 'https://%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO partners (id, name, url, logo_path, evidence_url, position, active) VALUES
  ('hazardco', 'HazardCo', 'https://www.hazardco.com/uk/', NULL, 'https://www.hazardco.com/uk/', 10, TRUE),
  ('stairbox', 'StairBox', 'https://www.stairbox.com/', '/partners/stairbox.svg', 'https://uk.linkedin.com/in/jadegriffin1', 20, TRUE),
  ('tools-and-jigs', 'Tools & Jigs', 'https://toolsandjigs.com/', '/partners/tools-and-jigs.png', 'https://toolsandjigs.com/', 30, TRUE),
  ('festool', 'Festool', 'https://www.festool.co.uk/', NULL, 'https://www.fixradio.co.uk/listen/podcasts/the-carpentry-show/', 40, TRUE),
  ('hilti', 'Hilti', 'https://www.hilti.co.uk/', NULL, 'https://www.linkedin.com/posts/robin-clevett-fioc-504a627_joinery-carpentry-building-activity-7438966391145172993-m5Lw', 50, TRUE),
  ('diamondback', 'Diamondback Toolbelts', 'https://toolbelts.com/', NULL, 'https://www.fixradio.co.uk/fix-feed/construction-news/post/diamondbacks-connor-crook-outlines-plans-for-product-expansion-in-carpentry-show-interview/', 60, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), url = VALUES(url), logo_path = VALUES(logo_path), evidence_url = VALUES(evidence_url), position = VALUES(position);

INSERT INTO pages (id, slug, title) VALUES
  (UUID(), '/media/', 'Media'),
  (UUID(), '/cladding/', 'Thermowood Cladding Enquiries')
ON DUPLICATE KEY UPDATE title = VALUES(title);
