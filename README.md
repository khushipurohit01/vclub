# V-Club Assignment Portal

A small GitHub + Netlify portal for publishing single-file HTML assignment presentations.

## What it does

- Public assignment hub at `/`
- Private manager at `/admin`
- Fixed admin password stored as a Netlify environment variable, not in browser code
- Upload one `.html`/`.htm` file per assignment
- Add title and short description
- Drag and drop assignments to reorder them
- Edit title/description
- Preview assignments
- Delete assignments
- Persistent assignment files + metadata stored in Netlify Blobs

Netlify Functions handle the API and Netlify Blobs provides the persistent storage. This means you do **not** need to commit each new assignment to GitHub.

## Deploy to GitHub + Netlify

1. Create a new GitHub repository, for example `v-club-assignments`.
2. Upload this whole folder to the repository root.
3. In Netlify, choose **Add new project → Import an existing project → GitHub** and select the repository.
4. Netlify should detect `netlify.toml`. The publish directory is `public` and functions are in `netlify/functions`.
5. Add a Netlify environment variable:
   - Key: `ADMIN_PASSWORD`
   - Value: your chosen private password
   - Make it available to Functions/runtime.
6. Deploy.
7. Open `https://YOUR-SITE.netlify.app/admin` and log in.

Netlify Functions and Blobs are deployed with the site. Blobs persist across new deploys.

## Important security note

The admin password is deliberately **not** stored in the frontend. Keep `ADMIN_PASSWORD` in Netlify's environment-variable settings. Do not put the real password in GitHub.

Uploaded assignment HTML is served with a restrictive sandbox Content-Security-Policy and is displayed inside a sandboxed iframe, so an assignment presentation cannot use the normal page origin to access the admin interface.

## File format

The portal intentionally accepts one HTML file only. Your current V-Club presentation format is a good fit because the HTML can contain its own CSS and JavaScript. If an assignment later needs images, fonts or other local assets, we can extend the uploader to accept a ZIP package.
