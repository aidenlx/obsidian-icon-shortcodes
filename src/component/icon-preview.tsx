import "../invalid.less";

import cls from "classnames";
import { Notice } from "obsidian";
import React, {
  HTMLAttributes,
  TextareaHTMLAttributes,
  useContext,
  useMemo,
  useState,
} from "react";

import { SVGIconId } from "../icon-packs/types";
import { sanitizeName } from "../icon-packs/utils";
import { Context } from "./icon-manager";

interface IconPreviewProps {
  iconId: SVGIconId;
  onIdChange: (...changes: { from: string; to: string | null }[]) => void;
}

const IconPreview = ({ iconId, onIdChange }: IconPreviewProps) => {
  const { packs, icons } = useContext(Context),
    { trash, pencil, star, checkmark } = icons;

  const [input, setInput] = useState(packs.getNameFromId(iconId.id) ?? ""),
    [isEditing, setIsEditing] = useState(false);

  const inputId = `${iconId.pack}_${sanitizeName(input)}`,
    isInputVaild = inputId === iconId.id || !packs.hasIcon(inputId);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const iconSrc = useMemo(() => packs.getIcon(iconId.id, true), [iconId.md5]);
  const renameIcon = async (renameTo: string) => {
    const newName = await packs.rename(iconId.id, renameTo);
    if (!newName)
      new Notice(`Failed to rename to ${input}, check log for details`);
    else {
      new Notice(`The icon is renamed to ${newName}`);
      setIsEditing(false);
      onIdChange({ from: iconId.id, to: newName });
    }
  };

  return (
    <div className="item">
      <div className="icon">
        <img className="isc-icon" src={iconSrc ?? undefined} />
      </div>
      <div className="name">
        {isEditing ? (
          <Text
            className={cls({ invalid: !isInputVaild })}
            onChange={(evt) => setInput(evt.target.value)}
            value={input}
          />
        ) : (
          <span>{input}</span>
        )}
      </div>
      <div className="buttons">
        <ObButton
          btnType="cta"
          icon={star}
          onClick={async () => {
            let newName;
            if ((newName = await packs.star(iconId.id))) {
              new Notice(`${iconId.id} is now ${newName}`);
              if (packs.hasIcon(iconId.id)) {
                onIdChange(
                  { from: iconId.id, to: newName },
                  { from: newName, to: iconId.id },
                );
              } else {
                onIdChange({ from: iconId.id, to: newName });
              }
            }
          }}
        />
        <ObButton
          btnType="cta"
          icon={isEditing ? checkmark : pencil}
          onClick={async () => {
            if (isEditing) {
              if (isInputVaild) {
                if (inputId !== iconId.id) {
                  await renameIcon(inputId);
                } else {
                  setIsEditing(false);
                }
              } else {
                new Notice(`Unable to rename to ${input}, given id invalid`);
              }
            } else {
              setIsEditing(true);
            }
          }}
        />
        <ObButton
          btnType="warning"
          icon={trash}
          onClick={async () => {
            if (await packs.delete(iconId.id)) {
              new Notice(`${iconId.id} is removed from the pack`);
              onIdChange({ from: iconId.id, to: null });
            }
          }}
        />
      </div>
    </div>
  );
};

export default IconPreview;

const ObButton = (
  props: HTMLAttributes<HTMLButtonElement> & {
    btnType?: "warning" | "cta";
    invalid?: boolean;
    icon: string;
  },
) => {
  const { btnType, icon, ...rest } = props;
  return (
    <button
      {...rest}
      className={cls({ ["mod-" + btnType]: !!btnType })}
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  );
};

const Text = (
  props: Pick<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "onChange" | "value" | "className"
  >,
) => <textarea spellCheck="false" rows={2} {...props} />;
