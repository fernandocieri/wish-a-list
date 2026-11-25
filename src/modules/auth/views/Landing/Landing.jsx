import GoogleSignInButton from './components/GoogleSignInButton'
import Pitch from './components/Pitch'

export default function Landing() {
  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-2xl">
      <Pitch />
      <div className="mt-8 sm:max-w-xs">
        <GoogleSignInButton />
      </div>
    </div>
  )
}
