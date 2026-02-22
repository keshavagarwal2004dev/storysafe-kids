# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Groq + Puter setup for story generation

1. Copy `.env.example` to `.env`.
2. Add your Groq key to `VITE_GROQ_API_KEY`.
3. Keep these model values (or change if needed):
	- `VITE_GROQ_MODEL_BLUEPRINT=llama-3.3-70b-versatile`
	- `VITE_GROQ_MODEL_STORY=llama-3.3-70b-versatile`
4. Run `npm run dev`.

NGO `Generate Story with AI` now runs this pipeline:

1. First Groq call (Llama 3.3 70B) builds strict story blueprint JSON with exact character count.
2. Second Groq call (Llama 3.3 70B) builds a tree-structured story JSON with 7-10 slides.
3. `puter.js` generates an image for each slide from the slide image prompt.
4. Generated story is saved and loaded in the story editor.

Note: this app currently uses client-side API calls for speed of integration. For production, move Groq calls to a backend to keep API keys fully private.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
