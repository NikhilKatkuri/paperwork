import { AuthIntent } from '@/auth/types';

function getIntentFromPathname(pathname: string): AuthIntent {
    switch (true) {
        case pathname.includes('forgot-password'):
            return 'forgotPassword';
        case pathname.includes('signup'):
            return 'signUp';
        case pathname.includes('signin'):
            return 'signIn';
        default:
            return 'signIn';
    }
}
export default getIntentFromPathname;
