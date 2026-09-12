import MetaInputFeilds from './Question-ui/MetaInputFeilds'

function QuestionsLayout() {
  return (
    <div className="flex-1 h-auto w-full lg:max-w-3xl  mx-auto  max-md:px-3 flex flex-col gap-4 items-center py-3 overflow-y-scroll">
        <MetaInputFeilds/>
    </div>
  )
}

export default QuestionsLayout