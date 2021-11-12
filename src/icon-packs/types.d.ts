type IdIconMap = Record<string, IconInfo>;
export type IconId = { id: string; pack: "emoji" } | SVGIconId;
export type SVGIconId = {
  id: string;
  pack: string;
  md5: string;
};
export type IconInfo = { pack: string; svg: string; md5: string };
