"use client"
import { FC, useState } from "react";
import SvgNewDatabase from "@/assets/generated/NewDatabase";
import SvgNewQuery from "@/assets/generated/NewQuery";
import SvgNewTemplate from "@/assets/generated/NewTemplate";
import { ActionCard } from "@/components/shared/ActionCard";
import { DisplayingStyleButtons } from "@/components/DisplayingStyleButtons";
import { AppModal } from "./components/shared/AppModal";

const listActions = [
  {
    modalId: 'new-database-modal',
    icon: <SvgNewDatabase />,
    title: 'New Database',
    subTitle: 'Create or import new database',
  },
  {
    modalId: 'new-query-modal',
    icon: <SvgNewQuery />,
    title: 'New Query',
    subTitle: 'Start saving your aggregations',
  },
  {
    modalId: 'new-template-modal',
    icon: <SvgNewTemplate />,
    title: 'New Template',
    subTitle: 'Browse and pick a template',
  },
]

const listModals = [
  {
    modalId: 'new-database-modal',
  },
  {
    modalId: 'new-query-modal',
  },
  {
    modalId: 'new-template-modal',
  },
]

const Page: FC = () => {
  const [selectedModal, setSelectedModal] = useState<string | undefined>(undefined);

  const handleClick = (modalId: string) => {
    setSelectedModal(modalId);
  }

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between">
        <div className="text-3xl font-bold">Orochi’s space</div>
        <DisplayingStyleButtons />
      </div>
      <div className="flex gap-4 py-6">
        {listActions.map(({ modalId, icon, title, subTitle }) => (
          <ActionCard
            key={modalId}
            icon={icon}
            modalId={modalId}
            title={title}
            subTitle={subTitle}
            handleClick={handleClick}
          />
        ))}
      </div>
      {listModals.map(modal => (
        <AppModal id={modal.modalId}>
          <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center">
            <div className="w-full flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white">
                  Modal title
                </h3>
                <button type="button" className="flex items-center justify-center text-sm font-semibold text-gray-800 border border-transparent rounded-full w-7 h-7 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none dark:text-white dark:hover:bg-gray-700 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600" data-hs-overlay={`#${selectedModal}`}>
                  <span className="sr-only">Close</span>
                  <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <p className="text-gray-800 dark:text-gray-400">
                  This is a wider card with supporting text below as a natural lead-in to additional content.
                </p>
              </div>
              <div className="flex items-center justify-end px-4 py-3 border-t gap-x-2 dark:border-gray-700">
                <button type="button" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-lg shadow-sm gap-x-2 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600" data-hs-overlay={`#${selectedModal}`}>
                  Close
                </button>
                <button type="button" className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg gap-x-2 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600">
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </AppModal>
      ))}
    </div>
  )
}

export default Page;