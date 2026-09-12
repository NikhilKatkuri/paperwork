import React from 'react'
import Navbar from '../Navbar'
import QuestionsLayout from '../Questions'

function FormCreatePageCreateLayout() {
  return (
    <div className="flex h-screen w-full flex-col">
      <Navbar/>
      <div className="flex-1 h-full w-full bg-theme-form-surface">
        <QuestionsLayout/>
      </div>
    </div>
  )
}

export default FormCreatePageCreateLayout