WARNING: This project has been created by ChatGPT. This is a note created by the user publishing this. The reason why ChatGPT has been used is because this project was only to be used for a personal projegt and I dont know how to code. 

WEIGHTED RANDOM GENERATOR
========================

This is a complete static web app. It uses plain HTML, CSS and JavaScript. It has no external libraries, accounts, trackers or network dependencies.

FILES
-----
index.html             Main page
css/style.css          Layout, colours and responsive styling
js/randomizer.js       Weighted parsing and draw logic
js/storage.js          Local saving for lists and preferences
js/app.js              Buttons and page behaviour
manifest.json          Installable app information
sw.js                  Offline service worker
assets/                App icons

OPEN IT ON YOUR COMPUTER
------------------------
For a quick visual check, you can double-click index.html. The generator and local saving work in a modern browser this way. Service-worker offline installation requires HTTPS or localhost.

PUBLISH WITH GITHUB PAGES
-------------------------
1. Extract this ZIP on your computer.
2. Open the extracted folder. You should see index.html, manifest.json, sw.js, css, js and assets.
3. In your GitHub repository, use Add file > Upload files.
4. Upload the CONTENTS of the extracted folder. Do not upload the outer folder itself. index.html must appear directly on the repository's main Code page beside manifest.json and sw.js.
5. Commit the upload.
6. In Settings > Pages, choose Deploy from a branch, branch main, folder /(root), then Save.
7. Open the Pages URL. The first publish can take a few minutes.

INPUT FORMAT
------------
A simple option is written as:
Banana / 2

The number after / is its weight. A higher weight means a higher chance of being picked. A weight of 0 disables the option.

Indented lines are variants within the unindented parent group:
Apple / 5
  Apple, Green / 2
  Apple, Yellow / 5
  Apple, Red / 3
Banana / 2
Orange / 4

Here, the Apple group has weight 5. If Apple is selected, its variants are chosen in a 2:5:3 ratio. The parent name is not returned when it has variants.

Blank lines and lines beginning with # are ignored. Each non-blank option line must include / and a weight.

FEATURES
--------
- Weighted random results and indented variant groups
- Zero-weight options are disabled
- Optional no-duplicates mode (returns as many unique results as are available)
- Generate from 1 to 500 results
- Multiple saved lists, automatically stored in this browser
- Copy individual results or all results
- Import a text list or JSON backup; export the current text list or all lists
- Light/dark theme and custom accent colour
- Responsive layout for desktop and mobile
- PWA manifest and offline service worker

DATA AND PRIVACY
----------------
Lists and preferences are stored in localStorage in the browser on the device where you use the app. They are not sent to a server. Export a backup if you want to move your lists to another device or browser.
