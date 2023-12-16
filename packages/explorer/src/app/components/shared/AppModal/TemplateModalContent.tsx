import { FC } from "react";
import { PrimaryButton } from "../Buttons/PrimaryButton";
import { SecondaryButton } from "../Buttons/SecondaryButton";
import { AppInput } from "../AppInput";

type TemplateModalContentProps = {
  modalId: string;
}

export const TemplateModalContent: FC<TemplateModalContentProps> = ({ modalId }) => {
  return (
    <div className="flex flex-col gap-8 mt-8">
      <div className="flex flex-col gap-8 overflow-y-auto">
        <AppInput label="Database name" placeholder="Database name"/>
        <AppInput label="Collection name" placeholder="Collection name"/>
      </div>
      <div className="flex items-center justify-end gap-x-2 dark:border-gray-700">
        <SecondaryButton data-hs-overlay={`#${modalId}`}>
          Cancel
        </SecondaryButton>
        <PrimaryButton>
          Create Database
        </PrimaryButton>
      </div>
    </div>
  );
}