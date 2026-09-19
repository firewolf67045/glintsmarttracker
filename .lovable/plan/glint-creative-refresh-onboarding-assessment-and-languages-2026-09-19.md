# Glint creative refresh, onboarding assessment, and languages

## What will change
- Refresh the signed-in home screen into a more energetic fitness dashboard with stronger hierarchy, playful accents, richer progress visuals, and clearer meal/body-scan actions.
- Add a short first-time assessment immediately after sign-in covering display name, goal, activity level, dietary style, and daily focus.
- Save assessment answers on the device and use them to personalize the greeting, goal selector, and recommended daily target until a Body Scan provides a more specific target.
- Add a language selector with 15 languages and translate the welcome flow, assessment, and primary dashboard actions and labels.
- Send the selected language to meal and physique analysis so new AI-generated results match the chosen language.

## Languages
English, Spanish, French, German, Portuguese, Italian, Dutch, Arabic, Hindi, Chinese, Japanese, Korean, Indonesian, Turkish, and Russian.

## Technical details
- Add one lightweight localization module with typed language IDs, display names, and interface dictionaries.
- Add a reusable assessment overlay shown once per account/device, with edit access from the signed-in header.
- Keep existing meal logging, Body Scan, local history, authentication, and safety disclaimers intact.
- Update the two existing analysis requests to include the selected language without changing their response shape.
- Verify sign-in gating, assessment completion, language switching, dashboard layout, and mobile/desktop rendering.
