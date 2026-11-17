-- One-time DBA setup. Replace the marker with a generated secret and review before use.
CREATE DATABASE robweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'robweb'@'10.%' IDENTIFIED BY 'REPLACE_WITH_GENERATED_SECRET';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON robweb.* TO 'robweb'@'10.%';
FLUSH PRIVILEGES;

-- Then, using the robweb account and database, run db/migrations in numeric order.
