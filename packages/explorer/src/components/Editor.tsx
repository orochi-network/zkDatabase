"use client";

import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { bbedit } from "@uiw/codemirror-theme-bbedit";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import clsx from "clsx";

const code = `/**
* Paste one or more documents here
*/
{
  “_id”: {
  “$oid”: “29jn8hz29u833bs82b73v63g”,
  “name”: “Ripley”,
  “class”: “barbarian”,
  “race”: “high elf”,
  }
}`;

interface Props {
  className: string;
}

export function Editor({ className }: Props) {
  return (
    <CodeMirror
      value={code}
      theme={bbedit}
      onChange={() => {}}
      className={clsx(className)}
      extensions={[
        json(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        javascript({ jsx: true }),
      ]}
    />
  );
}
