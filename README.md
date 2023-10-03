# Icon Shortcodes

![demo](https://user-images.githubusercontent.com/31102694/141667129-a6bd215d-cd12-4663-bb95-364c3f3c80c9.gif)

Insert emoji and custom icons with shortcodes

- Easily import and manage custom icons (support `.bmp`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, and `.webp`)
- Render custom icons in editor (Legacy editor supported by [Codemirror Options](https://github.com/nothingislost/obsidian-codemirror-options)
- Built-in Unicode 13.1 Emoji, [Lucide](https://lucide.dev) support
- [Font Awesome](https://fontawesome.com/), and [Remixicon](https://github.com/Remix-Design/RemixIcon) available via download
- [API](#for-developer) ready to be integrated by other plugins
- Fuzzy search: type in `:book` to find 📖(`:open_book:`) and 📗(`:green_book:`)

Inspired by [obsidian-emoji-shortcodes](https://github.com/phibr0/obsidian-emoji-shortcodes), [obsidian-icon-folder](https://github.com/FlorianWoelki/obsidian-icon-folder), [obsidian-icons](https://github.com/visini/obsidian-icons-plugin) and [remark-emoji](https://github.com/rhysd/remark-emoji).

NOTE: since v0.7.0, Font Awesome and RemixIcon are no longer bundled as bulti-in icon packs to reduce bundle size and speed up the loading. Go to the setting tab to download them.

Note: this plugin may conflicts with [obsidian-emoji-shortcodes](https://github.com/phibr0/obsidian-emoji-shortcodes), disable it before using this plugin

## How to use

### Insert Icon

This plugins support GitHub favored emoji shortcodes, the full list of which can be found here: [Emoji Cheat Sheet](https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md)

- To insert icon in editor, type in `:`/`：：` followed by the search query to get suggester, for example `:book`
  - for multiple keywords, add `+` between words, for example `:open+book`
  - You can disable suggester in the setting tab
- The emoji, by default, is inserted in character in favor of shortcodes, which is visible in both editor and preview, you can change this behavior in the setting tab

## Add Custom Icons

<https://user-images.githubusercontent.com/31102694/141667026-cbb0e668-ecbd-493e-9648-27ca7dfaa118.mp4>

> support icon format: `.bmp`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`

1. Go to setting tab
2. At the `Custom Icons` section, type in a name for new icon pack and click add button (better be short, it's acting as the id of icon pack and prefix of all icon shortcodes in this pack)
3. Add the new icon pack entry, drag supported file in or select them by click on `select file to import` button to import custom icons
4. You can access icon manager by clicking `manage` icon. each icon has the following button
   - `star`: remove `_1` suffix, useful when there are multiple alternative icons
   - `delete`, `rename`

## Backup & Restore Custom Icons

> v0.6.0+ required

Since v0.6.0, all custom icons are stored in `icons` folder under config directory (`.obsidian/icons` normally), you can:

- open folder (Desktop only)
- Backup all icons / selected icon pack to zip file (will be stored in the root vault directory)
- Restore icons from zip file

![custom-icon-buttons](https://user-images.githubusercontent.com/31102694/143665662-76ed8478-2e81-4006-a8a9-696258a268ce.png)

![custom-icon-backup-pack-button](https://user-images.githubusercontent.com/31102694/143665678-2ff7bf4c-3f21-41b1-87f9-b22e41895d59.png)

## Styling Icons

In order to customize the icons in order to change their color, size, etc, you should make a CSS snippet.

1. Go to Settings -> Appearance -> CSS Snippets
2. Turn on the CSS Snippets option and then click the folder to navigate to it's folder.
3. Make a new file called icons.css
4. Open icons.css in your preferred text editor
5. Add the following:
   ```css
   .isc-icon > *:first-child {
     /** changes for all icons. */
   }
   .isc-icon.icon-emoji-icon > *:first-child {
     /** changes for emoji icons. */
   }
   .isc-icon.isc-fas > *:first-child {
     /* changes for icons in the specific icon pack */
     /* (font awesome soild in this example) */
   }
   ```
6. Go Back to Settings -> Appearance -> CSS Snippets
7. Click the reload button
8. A button with the title "icons" should appear, turn it on.

Your changes will now be applied and you can edit the file when you want.

## For Developer

### Use API

1. run `npm i -D @aidenlx/obsidian-icon-shortcodes` in your plugin dir
2. import the api (add `import { getApi } from "@aidenlx/obsidian-icon-shortcodes"`)
3. use api
   1. check if enabled: `getApi() !== undefined` or `getApi(YourPluginInstance) !== undefined`
   2. access api: `getApi()` / `getApi(YourPluginInstance)`

For all exposed API method, check [api.ts](src/typings/api.ts)

## Compatibility

The required API feature is only available for Obsidian v1.0.0+.

## Installation

### From BRAT

To install a pre-release, download and enable the [Obsidian42 BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin, add the beta repository `aidenlx/obsidian-icon-shortcodes`, and then have BRAT check for updates.

### From GitHub

1. Download the Latest Release from the Releases section of the GitHub Repository
2. Put files to your vault's plugins folder: `<vault>/.obsidian/plugins/obsidian-icon-shortcodes`
3. Reload Obsidian
4. If prompted about Safe Mode, you can disable safe mode and enable the plugin.
   Otherwise, head to Settings, third-party plugins, make sure safe mode is off and
   enable the plugin from there.

> Note: The `.obsidian` folder may be hidden. On macOS, you should be able to press `Command+Shift+Dot` to show the folder in Finder.

### From Obsidian

> Not yet available

1. Open `Settings` > `Third-party plugin`
2. Make sure Safe mode is **off**
3. Click `Browse community plugins`
4. Search for this plugin
5. Click `Install`
6. Once installed, close the community plugins window and the plugin is ready to use.
