-- Robweb owns this schema. Review only: this task does not apply SQL.
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE users (
  id CHAR(36) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('owner','editor') NOT NULL,
  status ENUM('invited','active','disabled') NOT NULL DEFAULT 'invited',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_invitations (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_invitations_token (token_hash),
  KEY ix_user_invitations_user (user_id),
  CONSTRAINT fk_user_invitations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  token_hash CHAR(64) NOT NULL,
  user_id CHAR(36) NOT NULL,
  csrf_token CHAR(32) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY ix_sessions_user (user_id),
  KEY ix_sessions_expiry (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pages (
  id CHAR(36) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  title VARCHAR(200) NOT NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  current_revision INT UNSIGNED NOT NULL DEFAULT 0,
  published_revision INT UNSIGNED NULL,
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pages_slug (slug),
  CONSTRAINT fk_pages_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sections (
  id CHAR(36) NOT NULL,
  page_id CHAR(36) NOT NULL,
  type ENUM('Hero','FeatureList','Proof','ShopCta','AppCta','VideoGrid','Faq','ContactCta','Text','Image') NOT NULL,
  position SMALLINT UNSIGNED NOT NULL,
  data_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sections_position (page_id, position),
  CONSTRAINT fk_sections_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  CONSTRAINT ck_sections_data_object CHECK (JSON_TYPE(data_json) = 'OBJECT')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE page_revisions (
  id CHAR(36) NOT NULL,
  page_id CHAR(36) NOT NULL,
  revision_number INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  sections_json JSON NOT NULL,
  action ENUM('draft','publish','revert') NOT NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_page_revisions_number (page_id, revision_number),
  CONSTRAINT fk_page_revisions_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  CONSTRAINT fk_page_revisions_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT ck_page_revisions_array CHECK (JSON_TYPE(sections_json) = 'ARRAY')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE media (
  id CHAR(36) NOT NULL,
  path VARCHAR(500) NOT NULL,
  mime_type ENUM('image/jpeg','image/png','image/webp','image/avif') NOT NULL,
  bytes INT UNSIGNED NOT NULL,
  width SMALLINT UNSIGNED NOT NULL,
  height SMALLINT UNSIGNED NOT NULL,
  alt_text VARCHAR(500) NOT NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_path (path),
  CONSTRAINT fk_media_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT ck_media_size CHECK (bytes BETWEEN 1 AND 10485760),
  CONSTRAINT ck_media_alt CHECK (CHAR_LENGTH(TRIM(alt_text)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
  setting_key VARCHAR(120) NOT NULL,
  value_json JSON NOT NULL,
  updated_by CHAR(36) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key),
  CONSTRAINT fk_settings_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE form_submissions (
  id CHAR(36) NOT NULL,
  type ENUM('contact','interest') NOT NULL,
  fields_json JSON NOT NULL,
  status ENUM('new','handled','spam') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  handled_at DATETIME NULL,
  handled_by CHAR(36) NULL,
  PRIMARY KEY (id),
  KEY ix_form_submissions_inbox (status, created_at),
  CONSTRAINT fk_form_submissions_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT ck_form_fields_object CHECK (JSON_TYPE(fields_json) = 'OBJECT')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE analytics_daily (
  day DATE NOT NULL,
  path VARCHAR(240) NOT NULL,
  referrer_host VARCHAR(255) NOT NULL DEFAULT 'direct',
  device_class ENUM('phone','tablet','desktop','other') NOT NULL,
  visits INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path, referrer_host, device_class),
  KEY ix_analytics_path (path, day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE outbound_clicks (
  day DATE NOT NULL,
  source_path VARCHAR(240) NOT NULL,
  target VARCHAR(255) NOT NULL,
  count INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (day, source_path, target),
  KEY ix_outbound_target (target, day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
