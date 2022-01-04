import Fuse from "fuse.js";

interface IconBasicInfo {
  pack: string;
  name: string;
}

export type IconInfo = FileIconInfo | EmojiIconInfo | BultiInIconInfo;

type withId = { id: string };

interface IconBasicData {
  path?: string;
  data?: string;
}

type EmojiIconInfo = IconBasicInfo & withId & { pack: "emoji" };

type FileBasicInfo = IconBasicInfo & {
  path: string;
  /** with dot */
  ext: string;
};

export type FileIconInfo = FileBasicInfo & withId;
export type FileIconData = FileBasicInfo & IconBasicData & { data?: undefined };
export const isFileIconInfo = (id: IconInfo): id is FileIconInfo =>
  !!(id as FileIconInfo).ext;

export type BultiInIconInfo = IconBasicInfo & withId;
export type BultiInIconData = IconBasicInfo &
  IconBasicData & {
    path?: undefined;
    /** data uri */
    data: string;
  };

export type IdIconMap = Record<string, FileIconData | BultiInIconData>;

export type FuzzyMatch<T> = Fuse.FuseResult<T>;
