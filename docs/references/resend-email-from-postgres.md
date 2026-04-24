# Sending Emails from Postgres via Resend

Reference implementation used in the anonymous user cleanup cron job. Uses `net.http_post` (pg_net extension) and Supabase Vault for API key storage.

## Prerequisites
- `pg_net` extension enabled
- Resend API key stored in Supabase Vault as `resend_api_key`

## Usage Pattern

```sql
-- Fetch API key from vault
SELECT decrypted_secret INTO resend_key
FROM vault.decrypted_secrets
WHERE name = 'resend_api_key';

-- Send email via Resend API
PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
        'Authorization', 'Bearer ' || resend_key,
        'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
        'from', 'Jayant <team@jayantgoyal.com>',
        'to', ARRAY['goyal151002@gmail.com'],
        'subject', 'Your Subject Here',
        'html', email_html
    )
);
```

## Full Email Function (from anonymous cleanup cron)

This function was used in a nightly cron (`30 20 * * *`) to delete anonymous users and send an HTML email report.

```sql
CREATE OR REPLACE FUNCTION delete_anonymous_users_complete()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    table_record RECORD;
    file_record RECORD;
    result jsonb = '[]'::jsonb;
    user_result jsonb;
    deleted_count INTEGER;
    storage_files_deleted INTEGER = 0;
    total_deleted INTEGER = 0;
    email_html TEXT;
    resend_key TEXT;
    user_rows_html TEXT = '';
BEGIN
    FOR user_record IN
        SELECT id, email, created_at, last_sign_in_at
        FROM auth.users
        WHERE is_anonymous = true
    LOOP
        user_rows_html := user_rows_html || format(
            '<tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">%s</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">%s</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">%s</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">%s</td>
            </tr>',
            LEFT(user_record.id::text, 8) || '...',
            COALESCE(user_record.email, 'anonymous'),
            TO_CHAR(user_record.created_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM'),
            COALESCE(TO_CHAR(user_record.last_sign_in_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM'), 'Never')
        );

        user_result = jsonb_build_object(
            'user_id', user_record.id,
            'storage_files_deleted', 0,
            'records_deleted', '[]'::jsonb
        );

        -- 1. DELETE PHYSICAL FILES FROM STORAGE
        FOR file_record IN (
            SELECT name
            FROM storage.objects
            WHERE bucket_id = 'private-files'
            AND (
                owner_id = user_record.id::text
                OR metadata->>'user_id' = user_record.id::text
            )
        )
        LOOP
            BEGIN
                PERFORM storage.delete('private-files', file_record.name);
                storage_files_deleted := storage_files_deleted + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Failed to delete storage file %: %', file_record.name, SQLERRM;
            END;
        END LOOP;

        user_result = jsonb_set(user_result, '{storage_files_deleted}', to_jsonb(storage_files_deleted));

        -- 2. DELETE FROM ALL TABLES THAT REFERENCE AUTH.USERS
        FOR table_record IN (
            SELECT DISTINCT
                cl.relname AS table_name,
                nsp.nspname AS schema_name,
                att.attname AS column_name
            FROM pg_constraint con
            JOIN pg_class cl ON con.conrelid = cl.oid
            JOIN pg_namespace nsp ON cl.relnamespace = nsp.oid
            JOIN pg_attribute att ON att.attrelid = cl.oid
                AND att.attnum = ANY(con.conkey)
            WHERE con.confrelid = 'auth.users'::regclass
                AND con.contype = 'f'
                AND nsp.nspname NOT IN ('storage')
            ORDER BY nsp.nspname, cl.relname
        )
        LOOP
            BEGIN
                EXECUTE format('DELETE FROM %I.%I WHERE %I = $1',
                    table_record.schema_name, table_record.table_name, table_record.column_name)
                USING user_record.id;
                GET DIAGNOSTICS deleted_count = ROW_COUNT;
                IF deleted_count > 0 THEN
                    user_result = jsonb_set(user_result, '{records_deleted}',
                        (user_result->'records_deleted') || jsonb_build_object(
                            'schema', table_record.schema_name,
                            'table', table_record.table_name,
                            'count', deleted_count
                        )
                    );
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Error deleting from %.%: %', table_record.schema_name, table_record.table_name, SQLERRM;
            END;
        END LOOP;

        -- 3. FINALLY DELETE THE USER
        BEGIN
            DELETE FROM auth.users WHERE id = user_record.id;
            total_deleted := total_deleted + 1;
            result := result || user_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to delete user %: %', user_record.id, SQLERRM;
        END;

        storage_files_deleted := 0;
    END LOOP;

    -- Send email report via Resend
    SELECT decrypted_secret INTO resend_key
    FROM vault.decrypted_secrets
    WHERE name = 'resend_api_key';

    -- (HTML email body built here - see full implementation above)

    PERFORM net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || resend_key,
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
            'from', 'Jayant <team@jayantgoyal.com>',
            'to', ARRAY['goyal151002@gmail.com'],
            'subject', 'Anonymous Cleanup: ' || total_deleted || ' user(s) deleted',
            'html', email_html
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'timestamp', NOW(),
        'users_deleted', total_deleted,
        'results', result
    );
END;
$$;
```

## HTML Email Template

The function builds a styled HTML email with:
- Header with cleanup count badge
- Timestamp in IST
- Table of deleted users (ID, email, created_at, last_sign_in)
- Footer with site link
- Green "0 found" variant when nothing to clean

## Cron Schedule

Was scheduled as: `30 20 * * *` (daily at 8:30 PM UTC = 2:00 AM IST)
Job name: `cleanup-anonymous-users-nightly`
