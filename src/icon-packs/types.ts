import Fuse from "fuse.js";

interface IconBasicInfo {
  pack: string;
  name: string;
  md5?: string;
}

export type IconId = FileIconId | EmojiIconId | EmbedIconId;

type hasMd5 = { md5: string };
type noMd5 = { md5?: undefined };

interface IconBasicData {
  path?: string;
  data?: string;
}

type EmojiIconId = IconBasicInfo &
  noMd5 & {
    id: string;
    pack: "emoji";
  };

interface FileIconData extends IconBasicData {
  data?: undefined;
}

export type FileBasicInfo = IconBasicInfo &
  hasMd5 & {
    path: string;
    /** with dot */
    ext: string;
  };
export type FileIconId = FileBasicInfo & { id: string };
export type FileIconInfo = FileBasicInfo & FileIconData;
export const isFileIconId = (id: IconId): id is FileIconId =>
  !!(id as FileIconId).ext;

interface EmbedIconData extends IconBasicData {
  path?: undefined;
  data: string;
}
export type EmbedIconId = IconBasicInfo & hasMd5 & { id: string };
export type EmbedIconInfo = IconBasicInfo & hasMd5 & EmbedIconData;

export type IdIconMap = Record<string, FileIconInfo | EmbedIconInfo>;

export type FuzzyMatch<T> = Fuse.FuseResult<T>;
