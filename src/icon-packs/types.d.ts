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
  path: string;
  data?: undefined;
}
export type FileIconId = IconBasicInfo & hasMd5 & { id: string };
export type FileIconInfo = IconBasicInfo & hasMd5 & FileIconData;

interface EmbedIconData extends IconBasicData {
  path?: undefined;
  data: string;
}
export type EmbedIconId = IconBasicInfo & hasMd5 & { id: string };
export type EmbedIconInfo = IconBasicInfo & hasMd5 & EmbedIconData;

export type IdIconMap = Record<string, FileIconInfo | EmbedIconInfo>;

export type FuzzyMatch<T> = Fuse.FuseResult<T>;
