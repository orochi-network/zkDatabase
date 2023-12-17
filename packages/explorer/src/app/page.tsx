import { FC } from "react";
import SvgNewDatabase from "@/assets/generated/NewDatabase";
import SvgNewQuery from "@/assets/generated/NewQuery";
import SvgNewTemplate from "@/assets/generated/NewTemplate";
import { ActionCard } from "@/components/shared/ActionCard";
import { DisplayingStyleButtons } from "@/components/DisplayingStyleButtons";
import { AppModal } from "@/components/shared/AppModal";
import { DatabaseModalContent } from "@/components/shared/AppModal/DatabaseModalContent";
import { QueryModalContent } from "@/components/shared/AppModal/QueryModalContent";
import { TemplateModalContent } from "@/components/shared/AppModal/TemplateModalContent";

const listActions = [
  {
    modalId: 'new-database-modal',
    icon: <SvgNewDatabase />,
    title: 'New Database',
    subTitle: 'Create or import new database',
    modalContent: (modalId: string) => <DatabaseModalContent modalId={modalId} />,
  },
  {
    modalId: 'new-query-modal',
    icon: <SvgNewQuery />,
    title: 'New Query',
    subTitle: 'Start saving your aggregations',
    modalContent: (modalId: string) => <QueryModalContent modalId={modalId} />,
  },
  {
    modalId: 'new-template-modal',
    icon: <SvgNewTemplate />,
    title: 'New Template',
    subTitle: 'Browse and pick a template',
    modalContent: (modalId: string) => <TemplateModalContent modalId={modalId} />,
  },
]

const Page: FC = () => {

  return (
    <div className="flex-grow page-wrapper">
      <div className="flex items-center justify-between">
        <div className="text-3xl font-bold">Orochi’s space</div>
        <DisplayingStyleButtons />
      </div>
      <div className="flex gap-4 py-6">
        {listActions.map(({ modalId, icon, title, subTitle, modalContent }) => (
          <>
            <ActionCard
              key={modalId}
              modalId={modalId}
              icon={icon}
              title={title}
              subTitle={subTitle}
            />
            <AppModal key={modalId} id={modalId} title={title}>
              {modalContent(modalId)}
            </AppModal>
          </>
        ))}
      </div>
    </div>
  )
}

export default Page;