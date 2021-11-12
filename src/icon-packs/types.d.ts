import Fuse from "fuse.js";

interface IconBasicInfo {
  pack: string;
  md5?: string;
  name: string;
}

export type IconId = SVGIconId | EmojiIconId;
type EmojiIconId = IconBasicInfo & {
  id: string;
  pack: "emoji";
  md5?: undefined;
};
export type SVGIconId = Required<IconBasicInfo> & { id: string };
export type SVGIconInfo = Required<IconBasicInfo> & { svg: string };

export type IdIconMap = Record<string, SVGIconInfo>;

export type FuzzyMatch<T> = Fuse.FuseResult<T>;
