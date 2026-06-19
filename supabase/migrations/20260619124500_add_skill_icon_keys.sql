ALTER TABLE "portfolio"."skills"
ADD COLUMN IF NOT EXISTS "icon_key" "text" NOT NULL DEFAULT '';

UPDATE "portfolio"."skills"
SET "icon_key" = CASE lower(regexp_replace("name", '[^a-zA-Z0-9]+', '', 'g'))
  WHEN 'html' THEN 'html'
  WHEN 'html5' THEN 'html'
  WHEN 'css' THEN 'css'
  WHEN 'css3' THEN 'css'
  WHEN 'tailwindcss' THEN 'tailwind'
  WHEN 'react' THEN 'react'
  WHEN 'reactjs' THEN 'react'
  WHEN 'javascript' THEN 'javascript'
  WHEN 'typescript' THEN 'typescript'
  WHEN 'nextjs' THEN 'nextjs'
  WHEN 'redux' THEN 'redux'
  WHEN 'supabase' THEN 'supabase'
  WHEN 'jwt' THEN 'jwt'
  WHEN 'nodejs' THEN 'nodejs'
  WHEN 'postgresql' THEN 'postgresql'
  WHEN 'postgres' THEN 'postgresql'
  WHEN 'vercel' THEN 'vercel'
  WHEN 'git' THEN 'git'
  WHEN 'vite' THEN 'vite'
  WHEN 'java' THEN 'java'
  WHEN 'python' THEN 'python'
  ELSE "icon_key"
END
WHERE "icon_key" = '';
