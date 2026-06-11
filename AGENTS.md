<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from prior versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing code and heed all deprecation notices.
<!-- END:nextjs-agent-rules -->

# Nexo CRM Project Instructions

## Product and UI

- Always maintain a premium, clean, intentional interface. Avoid generic dashboard styling, placeholder-looking layouts, and unnecessary visual effects.
- Keep the established visual system consistent across pages, including typography, colors, spacing, borders, icons, interaction states, and responsive behavior.
- Use Portuguese for all user-facing text, including labels, validation messages, empty states, notifications, metadata, and accessibility labels.
- Preserve accessibility, visible focus states, keyboard navigation, sufficient contrast, and mobile usability.

## Engineering

- Use TypeScript strictly. Do not introduce `any`, unsafe casts, ignored type errors, or relaxed compiler settings to bypass problems.
- Keep components reusable when they represent repeated UI or behavior, but avoid abstractions that add complexity without meaningful reuse.
- Prefer simple, complete, functional implementations over complex systems that remain unfinished.
- Do not add fake features, decorative controls, buttons, filters, notifications, or integrations that do not work. Every interactive element must perform its stated action or be clearly identified as unavailable.
- Follow the existing Next.js, Tailwind CSS, Server Action, and Supabase patterns in the repository.
- Keep changes focused. Do not refactor unrelated areas unless required for correctness or maintainability.

## Supabase

- When changing Supabase tables, columns, enums, relationships, policies, functions, or triggers, always update the corresponding database types and application types.
- Document every database change in the relevant migration and update the README or other setup documentation when configuration, behavior, or deployment steps change.
- Keep Row Level Security enabled and review affected policies whenever the database schema changes.
- Never expose secret or service-role keys in browser code or committed files.

## Feature Preservation

- Never remove or disable an existing feature without explaining why it is necessary and what behavior changes as a result.
- Before replacing an implementation, verify that the replacement preserves existing user workflows unless a change was explicitly requested.

## Verification

- Before finishing, run lint, production build, and relevant tests whenever the environment permits.
- For user-facing changes, verify the affected flow and responsive layout when browser tooling is available.
- Report any validation step that could not be run and explain the limitation briefly.
