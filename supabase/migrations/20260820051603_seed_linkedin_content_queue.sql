begin;

insert into portfolio.linkedin_posts (
  status,
  topic,
  content,
  writing_slug,
  linkedin_post_urn,
  linkedin_post_url,
  published_at,
  deleted_at
)
values
  (
    'deleted',
    'Product architecture',
    $linkedin$🏠 WHEN “ONE APP TO RULE THEM ALL” BECAME THE PROBLEM


Six months ago, I merged 9 separate apps into one.


At the time, it felt brilliant:

    ↳ One codebase
    ↳ One deployment
    ↳ One place to fix everything


I had successfully turned nine small headaches into one large, highly organized headache. 😄


Then the house started getting crowded.


🌐 Portfolio wanted the front door open for everyone.

🛠️ Studio needed more room for tools, files, games, and experiments.

🔐 Auth became the overworked security guard:

    “Who are you?”
    “Have you signed in?”
    “And where exactly are you going?”

🎛️ Admin was already living separately—quietly watching everything from its own control room.


So I didn’t break up the family.

I simply gave everyone their own room.



━━━━━━━━━━━━━━━━━━━━

🏠 THE NEW HOUSE

━━━━━━━━━━━━━━━━━━━━


🌐 PORTFOLIO — The public room

    jayantgoyal.com
    My work, writing, and story.


🛠️ STUDIO — The workshop

    studio.jayantgoyal.com
    Tools, files, games, and experiments.


🔐 AUTH — The front door

    auth.jayantgoyal.com
    One shared sign-in and account security
    for both Studio and Admin.


🎛️ ADMIN — The control room

    admin.jayantgoyal.com
    Content, users, permissions,
    and behind-the-scenes controls.



Studio and Admin recognize the same person.

But they don’t hand that person the same keys.


    Same login.
    Different rooms.
    Different permissions.


That is SSO in the least technical way I can explain it. 😄



The funny part?


Merging 9 apps was the right decision then.

Splitting them now is the right decision too.


Because good architecture isn’t about choosing one structure forever.

It’s about noticing when the house needs another room.



Have you ever simplified something so much that it became complicated again? 😄


📖 Full story:

https://jayantgoyal.com/writing/from-one-nextjs-app-to-four-product-surfaces


#BuildInPublic #SoftwareEngineering #WebDevelopment #NextJS #DevJourney$linkedin$,
    'from-one-nextjs-app-to-four-product-surfaces',
    'urn:li:share:7495402526322655233',
    'https://www.linkedin.com/feed/update/urn:li:share:7495402526322655233/',
    '2026-08-18T08:53:40.768Z',
    '2026-08-18T09:03:43.501Z'
  ),
  (
    'published',
    'Product architecture',
    $linkedin$🏠 When “One App to Rule Them All” Became the Problem

Six months ago, I merged 9 separate apps into one.

At the time, it felt brilliant:
↳ One codebase
↳ One deployment
↳ One place to fix everything

I had successfully turned nine small headaches into one large, highly organized headache. 😄

Then the house started getting crowded.

🌐 Portfolio wanted the front door open for everyone.
🛠️ Studio needed room for tools, files, games, and experiments.
🔐 Auth became the overworked security guard asking, “Who are you, and where exactly are you going?”
🎛️ Admin was already living separately—quietly watching everything from its own control room.

So I didn’t break up the family. I simply gave everyone their own room.

🏠 THE NEW HOUSE

🌐 PORTFOLIO — jayantgoyal.com
My work, writing, and story.

🛠️ STUDIO — studio.jayantgoyal.com
Tools, files, games, and experiments.

🔐 AUTH — auth.jayantgoyal.com
One shared sign-in and account security for Studio and Admin.

🎛️ ADMIN — admin.jayantgoyal.com
Content, users, permissions, and behind-the-scenes controls.

Studio and Admin recognize the same person, but they don’t hand that person the same keys.

Same login. Different rooms. Different permissions.

That is SSO in the least technical way I can explain it. 😄

The funny part?

Merging 9 apps was the right decision then.
Splitting them now is the right decision too.

Good architecture isn’t about choosing one structure forever. It’s about noticing when the house needs another room.

Have you ever simplified something so much that it became complicated again? 😄

📖 Full story:
https://jayantgoyal.com/writing/from-one-nextjs-app-to-four-product-surfaces

#BuildInPublic #SoftwareEngineering #WebDevelopment #NextJS #DevJourney$linkedin$,
    'from-one-nextjs-app-to-four-product-surfaces',
    'urn:li:share:7495403240209928192',
    'https://www.linkedin.com/feed/update/urn:li:share:7495403240209928192/',
    '2026-08-18T08:56:30.963Z',
    null
  )
on conflict (linkedin_post_urn) do update
set
  status = excluded.status,
  topic = excluded.topic,
  content = excluded.content,
  writing_slug = excluded.writing_slug,
  linkedin_post_url = excluded.linkedin_post_url,
  published_at = excluded.published_at,
  deleted_at = excluded.deleted_at,
  publication_error = null;

insert into portfolio.linkedin_posts (
  status,
  topic,
  content,
  article_url,
  writing_slug,
  scheduled_for
)
values
  (
    'scheduled',
    'Product performance',
    $linkedin$⚡ A button click should not feel like a coffee break.

A few of my tools were doing everything “correctly”: saving the data, checking the user, updating the screen.

They were also giving me enough time to question my life choices between click and confirmation. 😄

So I stopped asking, “Which framework trick will make this fast?” and started following the whole journey of one click—from the browser, through authentication and the API, into PostgreSQL, and back again.

The biggest lesson was simple: speed is not one number. It is the sum of every small wait, plus what the interface does while the user is waiting.

Sometimes the database needs work. Sometimes the screen just needs to respond immediately and reconcile quietly.

Full story: https://jayantgoyal.com/writing/making-database-backed-interactions-feel-immediate

What is the longest you will tolerate a button pretending it did not hear you?

#BuildInPublic #ProductEngineering #WebPerformance #Supabase$linkedin$,
    'https://jayantgoyal.com/writing/making-database-backed-interactions-feel-immediate',
    'making-database-backed-interactions-feel-immediate',
    '2026-08-24T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Authentication',
    $linkedin$🔐 I built an entire app whose best work is sending you somewhere else.

Meet Auth.

It is the front desk for Studio and Admin. You sign in once, it confirms who you are, handles account safety, and sends you to the right room.

The important part: the same login does not mean the same access.

Studio may hand you tools, files, and games. Admin may politely say, “Nice try, but this door is for the control room.” 😄

That is the simplest way I think about SSO:
one identity, several destinations, different keys.

The goal is not to make security feel impressive. The goal is to make it feel almost invisible—until it needs to protect something.

Full context: https://jayantgoyal.com/writing/from-one-nextjs-app-to-four-product-surfaces

#BuildInPublic #ProductDesign #Authentication #SoftwareEngineering$linkedin$,
    'https://jayantgoyal.com/writing/from-one-nextjs-app-to-four-product-surfaces',
    'from-one-nextjs-app-to-four-product-surfaces',
    '2026-08-27T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Web performance',
    $linkedin$📦 My JavaScript bundle was getting a little too comfortable.

It had picked up optional libraries, large client boundaries, and code that arrived on pages where nobody had invited it.

My first instinct was the classic engineering strategy: stare at the code and develop strong opinions.

The useful strategy was measuring route by route. 😄

Some “obvious” changes barely moved the result. A few boring changes—loading optional features only when needed, shrinking client entry points, and setting budgets—did the real work.

The lesson was not “make every bundle tiny.” It was “know what each page is asking the user to download, and make that cost intentional.”

Full breakdown: https://jayantgoyal.com/writing/what-actually-reduced-the-nextjs-bundle

Have you ever optimized the thing that looked guilty, only to discover it was innocent?

#NextJS #WebPerformance #BuildInPublic #ProductEngineering$linkedin$,
    'https://jayantgoyal.com/writing/what-actually-reduced-the-nextjs-bundle',
    'what-actually-reduced-the-nextjs-bundle',
    '2026-08-31T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Content management',
    $linkedin$📝 At some point, editing portfolio copy in code stops feeling “developer-friendly.”

It starts feeling like your About section needs a deployment pipeline. 😄

I wanted one place to manage my work, writing, navigation, and presentation—without keeping a secret backup version in the code “just in case.”

So the public Portfolio and private Admin workspace now use the same content source. Admin edits it. The database validates it. Portfolio reads it. Cache invalidation makes the change visible.

The surprisingly hard part was not building a form. It was deciding which system owns the truth when the form, database, assets, and public page all disagree.

My answer: one source of truth, clear contracts, and loud failures.

Full story: https://jayantgoyal.com/writing/portfolio-cms-with-one-source-of-truth

#ContentManagement #BuildInPublic #ProductEngineering #NextJS$linkedin$,
    'https://jayantgoyal.com/writing/portfolio-cms-with-one-source-of-truth',
    'portfolio-cms-with-one-source-of-truth',
    '2026-09-03T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Realtime games',
    $linkedin$🎮 Browsers are confident little liars.

In a multiplayer game, each browser is absolutely certain that its player moved first, won fairly, and deserves another turn.

That is why I stopped treating the browser as the referee. 😄

The game room now has one shared authority that checks the players, turn order, move, result, and final state before accepting anything.

Once that foundation worked, nine different games could share the same basic room model without sharing all of their rules.

The product lesson goes beyond games: collaboration feels simple only when somebody has carefully decided what happens when two people act at once.

Full story: https://jayantgoyal.com/writing/building-server-validated-realtime-game-rooms

Which multiplayer bug has made you question reality?

#Realtime #GameDevelopment #BuildInPublic #ProductEngineering$linkedin$,
    'https://jayantgoyal.com/writing/building-server-validated-realtime-game-rooms',
    'building-server-validated-realtime-game-rooms',
    '2026-09-07T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Private files',
    $linkedin$📁 “It’s just a file upload” is one of software’s finest opening jokes.

Then arrive folders, duplicate names, progress, permissions, previews, signed links, interrupted uploads, and deletion that should be recoverable—but not forever.

Suddenly the upload button has a small legal department. 😄

For my private File Manager, I separated the file’s record from the file’s bytes. The database knows what the item is and who owns it; private storage holds the actual object.

That boundary made the tricky parts clearer: who may see a file, how long a link should work, what happens when an upload fails halfway, and how deletion stays consistent.

The interface still says “Upload.”

It is being very modest.

Full story: https://jayantgoyal.com/writing/designing-a-private-file-manager-on-supabase

#Supabase #ProductEngineering #BuildInPublic #FileManagement$linkedin$,
    'https://jayantgoyal.com/writing/designing-a-private-file-manager-on-supabase',
    'designing-a-private-file-manager-on-supabase',
    '2026-09-10T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Product ownership',
    $linkedin$🧩 I used to think “done” meant the code was merged.

Then I started owning complete products.

Done became:
Does the flow make sense?
Can a real person recover from a mistake?
Will the data still be correct tomorrow?
Can I explain why this feature exists?

And, occasionally: did I remember the empty state? 😄

Moving from feature work to product ownership changed the questions I ask before I touch the code. The implementation still matters, but it sits inside a much larger promise to the user.

That promise includes the awkward edges: loading, failure, permissions, documentation, deployment, and maintenance after the exciting part is over.

Full reflection: https://jayantgoyal.com/writing/from-shipping-features-to-owning-the-whole-product

What changed your definition of “done”?

#ProductOwnership #Engineering #BuildInPublic #CareerGrowth$linkedin$,
    'https://jayantgoyal.com/writing/from-shipping-features-to-owning-the-whole-product',
    'from-shipping-features-to-owning-the-whole-product',
    '2026-09-14T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Debugging',
    $linkedin$🐢 Slow apps are excellent storytellers.

They tell you exactly where the architecture is awkward—you just have to stop interrupting them with random optimizations.

I recently traced one slow interaction end to end. The delay was not hiding in one dramatic query. It was spread across several reasonable steps that had quietly formed a queue.

That is the dangerous kind of slowness: every piece looks innocent on its own. 😄

Measuring the full journey changed the fixes. I improved the actual work, but I also changed what the interface did immediately so the user was never left wondering whether the click registered.

Performance is partly engineering and partly communication.

The system should be fast. The product should also be honest while it works.

More here: https://jayantgoyal.com/writing/making-database-backed-interactions-feel-immediate

#Debugging #WebPerformance #ProductDesign #BuildInPublic$linkedin$,
    'https://jayantgoyal.com/writing/making-database-backed-interactions-feel-immediate',
    'making-database-backed-interactions-feel-immediate',
    '2026-09-17T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Studio',
    $linkedin$🛠️ Studio is what happened when my side projects refused to stay inside their folders.

A file manager wanted an interface.
A calculator wanted history.
Games wanted rooms.
Small tools wanted a home.

Eventually I stopped pretending they were unrelated experiments and gave them a proper workspace. 😄

Studio is still a place to explore, but it now has shared navigation, identity, design patterns, and product rules. Each tool can stay focused without rebuilding the same surrounding experience.

The interesting part of a product platform is not putting many things on one page.

It is finding the boundaries that let each thing grow without turning the whole place into a junk drawer.

Take a look: https://studio.jayantgoyal.com

What small project of yours accidentally became a product?

#BuildInPublic #ProductEngineering #IndieDevelopment #WebDevelopment$linkedin$,
    'https://studio.jayantgoyal.com',
    null,
    '2026-09-21T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Single source of truth',
    $linkedin$🗂️ My portfolio used to have a small identity crisis.

The public page knew one version of the story.
The code had another.
The admin screen was ready to create a third.

All three were very confident. 😄

The fix was not “sync them better.” It was removing the competition.

Now the database owns the content, Admin owns the editing experience, and Portfolio owns the public presentation. They share contracts, not duplicated copies.

This has made failures less comfortable—but much more useful. If canonical content is unavailable, the system says so instead of quietly serving an old story from a hidden fallback.

One source of truth is not only about cleaner data. It is about knowing which answer to trust at 2 AM.

Full story: https://jayantgoyal.com/writing/portfolio-cms-with-one-source-of-truth

#SystemDesign #ContentManagement #BuildInPublic #ProductEngineering$linkedin$,
    'https://jayantgoyal.com/writing/portfolio-cms-with-one-source-of-truth',
    'portfolio-cms-with-one-source-of-truth',
    '2026-09-24T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Engineering guardrails',
    $linkedin$🚧 Optimization without a budget is spring cleaning.

Everything looks wonderful for a day, and then somehow the same mysterious boxes return. 😄

After reducing the Next.js bundle, I did not want the result to depend on everyone remembering the investigation forever.

So the useful outcome was not only smaller pages. It was a set of measurable budgets that can complain when route costs grow again.

I am learning to value this kind of boring guardrail more and more:
tests for behavior,
constraints for data,
budgets for performance,
and documentation for decisions.

A good improvement solves today’s problem.
A good system also makes tomorrow’s regression noisy.

Full breakdown: https://jayantgoyal.com/writing/what-actually-reduced-the-nextjs-bundle

Which boring guardrail has saved you the most time?

#Engineering #WebPerformance #BuildInPublic #NextJS$linkedin$,
    'https://jayantgoyal.com/writing/what-actually-reduced-the-nextjs-bundle',
    'what-actually-reduced-the-nextjs-bundle',
    '2026-09-28T10:00:00+05:30'
  ),
  (
    'scheduled',
    'Why I build',
    $linkedin$👋 I keep building for a very simple reason: I am bad at leaving a useful idea alone.

A rough tool makes me wonder how it could feel calmer.
A repeated task makes me wonder what should disappear.
A confusing flow makes me open the editor “for five minutes.” 😄

The five minutes are rarely five minutes.

But that curiosity has moved me from implementing individual features to caring about complete products—the interface, system, data, failure cases, and the story behind why it exists.

JayantGoyal.com is where those experiments now meet: Portfolio tells the story, Studio holds the products, Auth protects identity, and Admin runs the control room.

I am sharing more of the work as it evolves—the useful lessons, the wrong turns, and the decisions that looked strange until they worked.

Why do you keep building?

My introduction: https://jayantgoyal.com/writing/why-i-keep-building

#BuildInPublic #ProductEngineering #DeveloperJourney #IndependentWork$linkedin$,
    'https://jayantgoyal.com/writing/why-i-keep-building',
    'why-i-keep-building',
    '2026-10-01T10:00:00+05:30'
  );

commit;
