import Navbar from '../Navbar'
import QuestionsLayout from '../Questions'

function FormCreatePageCreateLayout() {
  return (
    <div className="flex h-screen w-full flex-col">
      <Navbar/>
      <div className="flex-1 min-h-0 w-full bg-theme-form-surface">
        <QuestionsLayout/>
      </div>
    </div>
  )
}

export default FormCreatePageCreateLayout