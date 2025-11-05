# Simple Two-Videos Side-by-Side (React + Vite)

This is a minimal React app (Vite) that displays two local videos side-by-side.

How it works

- Static assets placed in `public/` are served as `/` by Vite.
- The app ships a small demo that expects two files at `public/videos/video1.mp4` and `public/videos/video2.mp4`.

Quick start (macOS / zsh)

```zsh
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev

# Open the URL printed by Vite (usually http://localhost:5173) in your browser.
```

Troubleshooting & commands run during development

If you encounter errors when starting the dev server, these are the steps that were used to diagnose and fix them during development of this repo.

- Check Node and npm versions:

```zsh
node -v
npm -v
```

- If Vite complains about Node version (example message: "Vite requires Node.js version 20.19+ or 22.12+"), upgrade Node. Recommended options:

  - Use nvm:

  ```zsh
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  # restart your shell then:
  nvm install 20.19.0
  nvm use 20.19.0
  node -v
  ```

  - Or use Homebrew (macOS):

  ```zsh
  brew install node@20
  ```

- If Vite fails to load the config because a plugin is missing (example error: "Cannot find module '@vitejs/plugin-react'"), install the missing plugin:

```zsh
# run from project root
npm install -D @vitejs/plugin-react
```

- After fixing version or missing-module issues, reinstall and run the dev server:

```zsh
npm install
npm run dev
```

Serving external videos (files outside the project)

Browsers served over HTTP cannot reliably access arbitrary `file://` paths on the host filesystem. Use one of these options to make external videos available to the app:

1. Symlink (quick, local)

```zsh
# create a symlink inside the project's public/ so Vite serves the files
# adjust the source path below to your dataset location
ln -s /Users/alevistorte/datasets /Users/alevistorte/Documents/00Projects/simpleConversationVisualizer/public/datasets

# After creating the symlink you can reference videos as:
# /datasets/seamless_interaction/.../V00_S1097_I00000049_P1080.mp4
```

Notes: some OS/browser combos prevent following symlinks or block cross-origin access. If videos still fail to play, try the HTTP server option below.

2. Lightweight local HTTP server (recommended for large datasets)

Create a tiny Express server that serves your dataset directory, then reference videos by HTTP URL:

```js
// tiny-server.js (example)
const express = require('express');
const app = express();
// serve the dataset folder at /datasets
app.use('/datasets', express.static('/Users/alevistorte/datasets'));
app.listen(5174, () => console.log('datasets available at http://localhost:5174'));

// run it
node tiny-server.js
```

Then use e.g. `http://localhost:5174/seamless_interaction/.../V00_S1097_I00000049_P1080.mp4` as the `<video>` src in the app.

3. Let users select files in the browser (no server changes)

Modify the app to accept local files through a file input. The browser creates an object URL for selected files using `URL.createObjectURL(file)`. This is the safest option when you don't want to move or serve files.

4. Copy or preprocess videos into `public/videos/`

If you prefer to keep everything inside the project, copy (or symlink) the specific files you need into `public/videos/` and reference them as `/videos/<name>.mp4`.

Implementation notes & caveats

- The repo contains a small utility UI (`PromptPairer`) that maps filenames (from your CSVs) into pairs, constructs the expected dataset path from `assets/files_dir.csv`, and shows prompts from `assets/PromptsToAnalyze.csv` beneath each video.
- The PromptPairer will display `file://` paths constructed from the CSV mapping. Most browsers will block `file://` playback when the page is served over HTTP, so prefer the symlink or HTTP server options.
- For strict frame-accurate sync you may need more advanced techniques (shared Media Source, MSE, or server-based streaming); the app uses a simple nudge/seek approach to keep two players roughly in sync.

If you want, I can add a small helper script to create a symlink for your dataset, or a tiny Express static server in the repo to serve the dataset directory. Tell me which you'd prefer and I'll implement it.
