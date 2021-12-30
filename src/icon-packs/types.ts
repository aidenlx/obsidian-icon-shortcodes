import Fuse from "fuse.js";

interface IconBasicInfo {
  pack: string;
  name: string;
  md5?: string;
}

export type IconInfo = FileIconInfo | EmojiIconInfo | EmbedIconInfo;

type hasMd5 = { md5: string };
type noMd5 = { md5?: undefined };
type withId = { id: string };

interface IconBasicData {
  path?: string;
  data?: string;
}

type EmojiIconInfo = IconBasicInfo & noMd5 & withId & { pack: "emoji" };

type FileBasicInfo = IconBasicInfo &
  hasMd5 & {
    path: string;
    /** with dot */
    ext: string;
  };

export type FileIconInfo = FileBasicInfo & withId;
export type FileIconData = FileBasicInfo & IconBasicData & { data?: undefined };
export const isFileIconInfo = (id: IconInfo): id is FileIconInfo =>
  !!(id as FileIconInfo).ext;

export type EmbedIconInfo = IconBasicInfo & hasMd5 & withId;
export type EmbedIconData = IconBasicInfo &
  hasMd5 &
  IconBasicData & {
    path?: undefined;
    /** data uri */
    data: string;
  };

export type IdIconMap = Record<string, FileIconData | EmbedIconData>;

export type FuzzyMatch<T> = Fuse.FuseResult<T>;
