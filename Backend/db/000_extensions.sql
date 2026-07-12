-- AssetFlow migration 000: extensions
create extension if not exists btree_gist;   -- booking overlap exclusion constraint
