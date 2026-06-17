import { redirect } from 'next/navigation'

const page = () => {
  redirect('/user/profile')
}

export default page