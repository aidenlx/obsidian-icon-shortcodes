# [0.6.0](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.5.1...0.6.0) (2021-11-27)


### Bug Fixes

* **pack-manager:** backupCustomIcons() no longer opens backup zip when finished ([b0afde7](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/b0afde70f801f1a7c70b994a06582c2e701c4063))
* **pack-manager:** change icon dir to .obsidian/icons to avoid sync conflict; fix failed to load when customIconsDir not exist ([76c93ff](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/76c93ffff6b9899c35f1e02f4383551a1c0f4210))
* **pack-manager:** fix backup icon not working ([e6bc2dc](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/e6bc2dcc7ed9fc87dcfbb865fd36fed1ef291184))
* **pack-manager:** fix broken rename() and star() method ([ff82174](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/ff821745c4870aac66c1c16a1cc2b33769eaa8d6))
* **pack-manager:** fix failed to star icon ([b1cf68b](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/b1cf68b40c760ab0f27bedae31fb241170679a66))
* **pack-manager:** fix filepath not updated when rename/star icon ([da7b956](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/da7b9568033321d1e0e583894d9964675d1e5483))
* **pack-manager:** renameIconFile() is now working ([d016e9e](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/d016e9ed66edbf0b8afcfa9d4c37edd5d5d10bbc))


### Features

* add icon update prompt on load ([b459fbe](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/b459fbee4b5dcf73c7c038dbdc5e851f024bf131))
* add support for bitmap icons (png, jpg, webp...) ([50c0914](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/50c09144d4a1ded79b236e82be08a89a6899d524)), closes [#9](https://github.com/aidenlx/obsidian-icon-shortcodes/issues/9)
* **api:** expose version and utils: compare, satisfies ([cb3cc01](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/cb3cc01163f46c35c9bab87e294d56d0697055a5))
* **pack-manager:** backup custom icons in a zipped file ([8938309](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/89383090663bc284686cf03f37c93eece3c0255c)), closes [#10](https://github.com/aidenlx/obsidian-icon-shortcodes/issues/10)
* **pack-manager:** backupCustomIcons() now support backup one icon pack ([1668306](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/166830635fc39d636f509d0268d5f9208c3d6346))
* **pack-manager:** icons now stores as dedicated files ([c77256a](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/c77256a5062400c54172d4051633c88a7642065e)), closes [/github.com/obsidianmd/obsidian-releases/pull/640#issuecomment-969926491](https://github.com//github.com/obsidianmd/obsidian-releases/pull/640/issues/issuecomment-969926491)
* **pack-manager:** import file with existing id no longer override existing icon ([2ba067a](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/2ba067ae5a39a673c4dc0e22b64d350f4ba066dc))
* **pack-manager:** restore from backup zip file ([fde5b7f](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/fde5b7ff469f8e238d0a8108eac41a669ee3c1e4))
* **settings:** add button to open custom icon folder; adjust interface ([ad8764f](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/ad8764fd0f421b5c9519da08a050b5d577a94b20))
* **settings:** new custom icon entry now automatically scroll into view ([92a58fe](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/92a58fe9cb3eb09101393e86098795770631f004))

## [0.5.1](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.5.0...0.5.1) (2021-11-18)


### Features

* **api:** expose isEmoji() method; hasIcon() now accept shortcode with colons ([d63bbdb](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/d63bbdb4d5aa56979b6a34c666478cd148daa455))

# [0.5.0](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.4.3...0.5.0) (2021-11-18)


### Bug Fixes

* now imported name should be convert to lower case id ([88c71e5](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/88c71e5a95c0c24d3184ae82d1a8147663a7c3d0))


### Features

* **api:** expose iconsc:changed and iconsc:initialized evt in app.vault ([6e86c8b](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/6e86c8b6ce833146f8bd71ff0eb54a2540addc70))
* **suggester:** option to set if space is inserted next to shortcode ([44075fb](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/44075fbe09b6624b0ba48398124ef537cdbf6a75))

## [0.4.3](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.4.2...0.4.3) (2021-11-17)


### Bug Fixes

* bulti-in icons now display properly in dark mode ([5f631ab](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/5f631ab17e2157e180f94ba8e7b6d5225e8c4616))
* **settings:** fix unable to toggle remixicon filled icons ([55b898c](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/55b898c89baca2b938a24b5865bb3c8ed0005b54)), closes [#15](https://github.com/aidenlx/obsidian-icon-shortcodes/issues/15)


### Features

* **suggester:** add highlight for matched text ([7c5e122](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/7c5e1220a8fddf4a42132d80f40ef59c59b241f1))

## [0.4.2](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.4.1...0.4.2) (2021-11-15)


### Bug Fixes

* fix icon size setting not working ([d833df8](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/d833df8cfd772b56bc52a754899e9dd5cbb8abf5)), closes [#12](https://github.com/aidenlx/obsidian-icon-shortcodes/issues/12)

## [0.4.1](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.4.0...0.4.1) (2021-11-15)


### Bug Fixes

* **api:** fix api not being exposed to global ([7dfbd60](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/7dfbd60e777358ada60b4709c7d564e63012fbad))
* fix .isc-icon style only set in markdown preview view ([aa88eeb](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/aa88eebabef6813654e7be05883c97328971aeda))

# [0.4.0](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.3.3...0.4.0) (2021-11-14)


### Features

* add initial api support ([e9f5b29](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/e9f5b29afd705e6d15822b33e50ca388d32a5206))

## [0.3.3](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.3.2...0.3.3) (2021-11-14)


### Bug Fixes

* update manifest to support mobile ([361872a](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/361872a6aebb7cc705a917c530cfd46858a6e9df))

## [0.3.2](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.3.1...0.3.2) (2021-11-14)


### Bug Fixes

* **pack-manager:** fix filter() empty cached ids ([6e24f5d](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/6e24f5d3dde45dbd57a76570aaa3612c410536e2))

## [0.3.1](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.3.0...0.3.1) (2021-11-14)


### Bug Fixes

* **pack-manager:** fix disabled icon pack appears in search results ([0ebfe04](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/0ebfe04308a1e9d9cf7d4eeaa6eb6e1140e4078c))
* **suggester:** fix suggester triggered after shortcode being inserted ([efb9db1](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/efb9db17b0a751cf6750b7138b6a9f0ef79b6a56))

# [0.3.0](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.2.0...0.3.0) (2021-11-13)


### Bug Fixes

* **icon-manager:** fix ui can only be updated once ([5473747](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/5473747ad3f41b88d0b0dcd4b80d82712eafffc9))


### Features

* **icon-manager:** adjust button and interface; add filter box (not functional) ([32fa009](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/32fa00944a42025109e242c6d12efef42e388d8e))
* **icon-packs:** add class for every icon pack ([4c16a11](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/4c16a11a68ae9e1a6693a3d6c2a4edd816178a7e))
* implement fuzzy search; searchbox in icon-manager is now functional ([bcb6470](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/bcb64702a0589e0176ee47541306e66f98946075)), closes [#7](https://github.com/aidenlx/obsidian-icon-shortcodes/issues/7)
* validation on adding packname and renaming icons ([a33c33c](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/a33c33ca019ed0580f2301907d5f50b84b999c33))

# [0.2.0](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.1.1...0.2.0) (2021-11-12)


### Bug Fixes

* **icon-packs:** fix iconIds return invalid ids ([dce5aa2](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/dce5aa2443d143f563f13076b6bc8be53720c671))


### Features

* **icon-manager:** add stat btn ([67c195f](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/67c195ffa88256a440fcb0f1fbcd9f4d0d1499cc))
* **settings:** pack series can now be enabled separately ([6957b83](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/6957b83f4eabd49917cb2f4891cb91dd694a2150))

## [0.1.1](https://github.com/aidenlx/obsidian-icon-shortcodes/compare/0.1.0...0.1.1) (2021-11-11)


### Bug Fixes

* **icon-pack:** remove unnecessary svg checks ([94f5e55](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/94f5e5571b53689f7a628a488a27a0e954dcdfed))

# 0.1.0 (2021-11-09)


### Bug Fixes

* **icon-manager:** fix issues on renaming; rename pack prefix is no longer allowed ([ea54dd6](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/ea54dd6456d8acd38ccc1218e294293fd52d0a4e))
* **icon-packs:** sanitize id when given user input (rename/import icon) ([d228946](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/d2289461fd4e144413770b6b5aef24eef033e7b3))
* **icon:** fix github shortcode issues ([b90ab97](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/b90ab97cc6cd01b899242067b0f0cc9ec1405d2e))
* **icon:** remove unintented margin around icon ([f3a3a92](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/f3a3a924272bcf3d13b443e143c1dab928bf6219))


### Features

* initial support for external icons ([f36f844](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/f36f84481be7003c088f60c28fbf4b9433599c3d))
* initial support to import custom svgs ([831a064](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/831a0640bad3ccf0f01ed801caa4d88ce04a3aa1))
* initial support to import/export icon ([7f3bbf1](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/7f3bbf1399100014339ac406b6a64ea7540bd474))
* initial support to manage custom icons ([e02054c](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/e02054c1a948a4e7aec49d40641f5f5ac8054881))
* **settings:** add options to skip icon packs in suggester; update setting desc ([c8648bb](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/c8648bb23e90ea009a33139b76de1b44ffc62b8d))
* **settings:** button to remove custom icon pack ([7367e53](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/7367e5386711c8297b0a6a2a53864add5c165d7b))
* **suggester:** add fuzzy search; _ in shortcode suggestion is replaced by space ([4296837](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/42968377717396a5658ef72f8d5676bc1f0b598c))
* **suggester:** for item names: hide icon pack prefix; dash is replaced by space ([22e5666](https://github.com/aidenlx/obsidian-icon-shortcodes/commit/22e56667b69217716219316d874fda60c1215589))

