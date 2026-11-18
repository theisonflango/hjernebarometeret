-- Read only. Check these results immediately before and after the F-01 pause.
-- An absent role or function yields NULL rather than an apparent denial.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '10s';
SET LOCAL search_path = pg_catalog;

WITH expected(signature) AS (
  VALUES ('hjernebarometeret.spend_credit(text)'),
         ('hjernebarometeret.redeem_coupon(text,uuid)')
), api_roles(name) AS (
  VALUES ('anon'), ('authenticated'), ('service_role')
)
SELECT e.signature,
       api.name AS api_role,
       r.oid IS NOT NULL AS role_found,
       p.oid IS NOT NULL AS function_found,
       pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer,
       has_schema_privilege(r.oid, p.pronamespace, 'USAGE') AS schema_usage,
       has_function_privilege(r.oid, p.oid, 'EXECUTE') AS effective_execute,
       CASE WHEN p.oid IS NOT NULL THEN EXISTS (
         SELECT FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
         WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
       ) END AS public_execute
FROM expected e
CROSS JOIN api_roles api
LEFT JOIN pg_roles r ON r.rolname = api.name
LEFT JOIN pg_proc p ON p.oid = to_regprocedure(e.signature)
ORDER BY e.signature, api.name;

-- Additional overloads of these functions require a separate release decision.
SELECT p.oid::regprocedure AS found_signature
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'hjernebarometeret'
  AND p.proname IN ('spend_credit', 'redeem_coupon')
ORDER BY p.oid::regprocedure::text;

COMMIT;
