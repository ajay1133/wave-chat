export function customRouteWrapper(handler: any) {
	return (req: any, res: any) => {
		Promise.resolve(handler(req, res)).catch((e) => {
			console.error(`${req.method} ${req.path} failed`, e);
			if (res.headersSent) {
				return;
			}
			const message = e instanceof Error ? e.message : 'Something went wrong';
			res.status(500).json({ error: `internal error: ${message}` });
		});
	};
}
