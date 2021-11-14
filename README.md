# Icon Shortcodes

![demo](https://user-images.githubusercontent.com/31102694/141667129-a6bd215d-cd12-4663-bb95-364c3f3c80c9.gif)

Add support for [emoji shortcodes](https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md) and custom icons shortcodes

- Built-in Unicode 13.1 Emoji, [Font Awesome](https://fontawesome.com/), and [Remixicon](https://github.com/Remix-Design/RemixIcon) support
- Fuzzy search: type in `:book` to find 📖(`:open_book:`) and 📗(`:green_book:`)
- Easily import and manage custom SVG icons

Inspired by [obsidian-emoji-shortcodes](https://github.com/phibr0/obsidian-emoji-shortcodes), [obsidian-icons](https://github.com/visini/obsidian-icons-plugin) and [remark-emoji](https://github.com/rhysd/remark-emoji).

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

1. Go to setting tab
2. At the `Custom Icons` section, type in a name for new icon pack and click add button (better be short, it's acting as the id of icon pack and prefix of all icon shortcodes in this pack)
3. Add the new icon pack entry, drag SVG file in or select them by click on `select file to import` button to import custom icons
4. You can access icon manager by clicking `manage` icon. each icon has the following button
   - `star`: remove `_1` suffix, useful when there are multiple alternative icons
   - `delete`, `rename`

## Styling Icons

In order to customize the icons in order to change their color, size, etc, you should make a CSS snippet.

1. Go to Settings -> Appearance -> CSS Snippets
2. Turn on the CSS Snippets option and then click the folder to navigate to it's folder.
3. Make a new file called icons.css
4. Open icons.css in your preferred text editor
5. Add the following:
   ```css
   .isc-icon {
     /** changes for all icons (except emoji). */
   }
   .isc-icon.isc-{ICON_PACK_NAME} {
     /** changes for icons in the specific icon pack */
   }
   ```
6. Go Back to Settings -> Appearance -> CSS Snippets
7. Click the reload button
8. A button with the title "icons" should appear, turn it on.

Your changes will now be applied and you can edit the file when you want.

## Bulti-in Icon Packs and Licenses

| Icon Pack                                              | License                                                           | Version |
| ------------------------------------------------------ | ----------------------------------------------------------------- | ------- |
| [Font Awesome](https://fontawesome.com/)               | [CC BY 4.0 License](https://creativecommons.org/licenses/by/4.0/) | 5.15.4  |
| [Remixicon](https://github.com/Remix-Design/RemixIcon) | [Apache License Version 2.0](http://www.apache.org/licenses/)     | 2.5.0   |

## Compatibility

The required API feature is only available for Obsidian v0.12.17+.

## Installation

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
