import Fuse from "fuse.js";

interface IconBasicInfo {
  pack: string;
  name: string;
}

export type IconInfo = FileIconInfo | EmojiIconInfo | BultiInIconInfo;

type withId = { id: string };

type EmojiIconInfo = IconBasicInfo & withId & { pack: "emoji" };
type EmojiIconData = EmojiIconInfo & { char: string };

type FileBasicInfo = IconBasicInfo & {
  /** path relative to vault */
  path: string;
  /** with dot */
  ext: string;
};

export type FileIconInfo = FileBasicInfo & withId;
export type FileIconData = IconBasicInfo & {
  /** real path in file system, null if not in Desktop */
  fsPath: string | null;
  /** resource path to icon file */
  resourcePath: string;
};
export const isFileIconInfo = (id: IconInfo): id is FileIconInfo =>
  !!(id as FileIconInfo).ext;

export type BultiInIconInfo = IconBasicInfo & withId;
export type BultiInIconData = IconBasicInfo & {
  /** data uri of svg icon */
  dataUri: string;
  /** svg icon raw content */
  data: string;
};

export type FuzzyMatch<T> = Fuse.FuseResult<T>;
