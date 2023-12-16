import { FC } from "react";

type AppInputProps = {
  label: string;
  placeholder: string;
}

export const AppInput: FC<AppInputProps> = ({ label, placeholder }) => {
  return (
    <div>
      {label && <label htmlFor="app-input" className="text-sm">{label}</label>}
      <input id="app-input" className="block w-full p-2 text-xs border rounded-lg focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none" placeholder={placeholder}></input>
    </div>
  );
}