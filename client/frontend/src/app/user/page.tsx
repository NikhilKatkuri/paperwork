import { redirect } from 'next/navigation'

const page = () => {
  redirect('/user/settings')
}

export default page