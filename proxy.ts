import { auth } from '@/lib/auth/server';

export default auth.middleware({
  loginUrl: '/login',
});

export const config = {
  matcher: [
    '/create/:path*',
    '/category/:path*',
    '/rooms/:path*',
  ],
};
