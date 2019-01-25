-- Postgres alter script (only run first time! may overwrite things...)
CREATE DATABASE photodb;
\connect photodb;
CREATE TABLE users ( -- note: `user` is a reserved keyword in Postgres SQL
    user_id bigserial primary key,
    email text NOT NULL,
    password text NOT NULL
);
-- For testing (and demo) purposes
-- To log in on client-side React app, use: (email, password) = (test, 123)
INSERT INTO users (email, password)
VALUES ('test', '78bbf9c8a9f5d4ae32365449d21c3830220a776f583fd923c1187e4bfcfe5d4c');