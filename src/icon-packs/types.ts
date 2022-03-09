import Fuse from "fuse.js";

interface IconBasicInfo {
  pack: string;
  name: string;
}

export type IconInfo = FileIconInfo | EmojiIconInfo | BultiInIconInfo;
export type IconData = FileIconData | EmojiIconData | BultiInIconData;

type withId = { id: string };

type EmojiIconInfo = IconBasicInfo & { pack: "emoji" } & withId;
export type EmojiIconData = EmojiIconInfo &
  IconBasicData & { char: string; type: "emoji" };

type FileBasicInfo = IconBasicInfo & {
  /** path relative to vault */
  path: string;
  /** with dot */
  ext: string;
};

type IconBasicData = {
  getDOM(svg: true): HTMLSpanElement | Promise<HTMLSpanElement>;
  getDOM(svg?: false): HTMLSpanElement;
};

export type FileIconInfo = FileBasicInfo & withId;
export type FileIconData = FileBasicInfo &
  IconBasicData & {
    /** real path in file system, null if not in Desktop */
    fsPath: string | null;
    /** resource path to icon file */
    resourcePath: string;
    type: "file";
    isSVG: boolean;
  };
export const isFileIconInfo = (id: IconInfo): id is FileIconInfo =>
  !!(id as FileIconInfo).ext;

export type BultiInIconInfo = IconBasicInfo & withId;
export type BultiInIconData = IconBasicInfo &
  IconBasicData & {
    /** data uri of svg icon */
    dataUri: string;
    /** svg icon raw content */
    data: string;
    type: "bulti-in";
  };

export type FuzzyMatch<T> = Fuse.FuseResult<T>;
