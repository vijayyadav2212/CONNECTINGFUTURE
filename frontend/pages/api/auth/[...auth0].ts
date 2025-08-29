import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';

export default handleAuth({
	async login(req: NextApiRequest, res: NextApiResponse) {
		try {
			await handleLogin(req, res, {
				authorizationParams: {
					audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || process.env.AUTH0_AUDIENCE,
					scope: 'openid profile email'
		},
		returnTo: '/post-login'
			});
		} catch (e: any) {
			res.status(e.status || 400).end(e.message);
		}
	}
});
