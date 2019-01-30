-- Postgres alter script (only run first time! may overwrite things...)
\connect photodb;

ALTER TABLE users ADD UNIQUE (email);

-- date represents a timestampz (at UTC, ie) where date specifies that any token before that time is invalid.
CREATE TABLE blacklist (
  blacklist_id bigserial primary key,
  user_id bigserial REFERENCES users(user_id) UNIQUE,
  date timestamp with time zone
);
-- groups such as: 'public', 'family', 'admin', etc
CREATE TABLE groups (
  group_id bigserial primary key,
  privilege text UNIQUE -- (name and group are reserved words)
);
CREATE TABLE usergroup (
  usergroup_id bigserial primary key,
  user_id bigserial REFERENCES users(user_id),
  group_id bigserial REFERENCES groups(group_id)
);

-- Insert some basic groups:
INSERT INTO groups (privilege)
VALUES ('public');
INSERT INTO groups (privilege)
VALUES ('family');
INSERT INTO groups (privilege)
VALUES ('admin');

-- make 'test' user have 'public' privilege
INSERT INTO usergroup (user_id, group_id)
  SELECT u.user_id, g.group_id FROM users u
  JOIN groups g ON u.user_id = (
    SELECT user_id FROM users
    WHERE users.email = 'test'
  )
  WHERE g.group_id = (
    SELECT group_id FROM groups
    WHERE groups.privilege = 'public'
  );

-- Some example usage (to be called in a procedural lang like JavaScript) below:

-- Insert row into blacklist for given user email and date
-- @see https://stackoverflow.com/questions/42876071/how-to-save-js-date-now-in-postgresql
INSERT INTO blacklist (user_id, date)
  SELECT user_id, to_timestamp(1548866378841 / 1000.0) -- Date.now() / 1000.0 in JavaScript (eg, ms since UNIX epoch)
  FROM users
  WHERE users.email = 'test';  -- replace 'test' with some variable generated in a procedural language

-- Retrieve blacklist date for a given user
SELECT date
FROM blacklist
INNER JOIN users
ON blacklist.user_id = users.user_id
INNER JOIN users u1
ON u1.email = 'test';  -- replace 'test' with some variable generated in a procedural language

-- 2 ways to get the group privilege associated with a given email:

-- 1, using WHERE (with nesting)
SELECT privilege FROM groups
WHERE groups.group_id = (
  SELECT group_id FROM usergroup
  WHERE usergroup.user_id = (
    SELECT user_id FROM users
    WHERE users.email = 'test' -- replace 'test' with some variable generated in a procedural language
  )
);
-- 2, using INNER JOIN + ON (without nesting --> this is preferred: https://stackoverflow.com/questions/1018822/inner-join-on-vs-where-clause)
SELECT privilege
FROM groups
INNER JOIN usergroup
ON groups.group_id = usergroup.group_id
INNER JOIN users
ON users.email = 'test'; -- replace 'test' with some variable generated in a procedural language


-- @see https://stackoverflow.com/questions/9571392/ignoring-time-zones-altogether-in-rails-and-postgresql/9576170#9576170 ie 
-- also see https://www.postgresql.org/docs/current/view-pg-timezone-names.html ie `select * from pg_timezone_names;`
-- ie: '2012-03-05 07:00:00 America/Los_Angeles'
INSERT INTO blacklist (user_id, date)
  SELECT user.user_id, SOME_DATE -- set SOME_DATE from javascript / client code, needs to be of the right form
  FROM users
  INNER JOIN blacklist
  ON users.user_id = list.blacklist_id;
