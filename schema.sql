-- Create the database (DB2 typically uses schemas instead of standalone databases)
CREATE SCHEMA journal_db;

-- Switch to the schema
SET SCHEMA journal_db;

-- Create users table
CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- Use GENERATED ALWAYS AS IDENTITY for auto-increment
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255)
);

-- Create entries table
CREATE TABLE entries (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER,
    content CLOB,  -- Use CLOB for large text fields in DB2
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- DB2 uses CURRENT_TIMESTAMP for date/time
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
