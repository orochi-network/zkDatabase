import { FC } from "react";
import { Button } from "../Button";
import { AppInput } from "../AppInput";
import { ButtonVariant } from "@/types/index";

type QueryModalContentProps = {
  modalId: string;
}

export const QueryModalContent: FC<QueryModalContentProps> = ({ modalId }) => {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex flex-col gap-4 overflow-y-auto">
        <AppInput label="Database name" placeholder="Database name"/>
        <AppInput label="Collection name" placeholder="Collection name"/>
      </div>
      <div className="flex items-center justify-end gap-x-2 dark:border-gray-700">
        <Button variant={ButtonVariant.secondary} data-hs-overlay={`#${modalId}`}>
          Cancel
        </Button>
        <Button variant={ButtonVariant.primary}>
          Create Database
        </Button>
      </div>
    </div>
  );
}