export function createMockRes() {
	const res: any = {
		status(code: any) {
			res.statusCode = code;
			return res;
		},
		json(body: any) {
			res.jsonBody = body;
			return res;
		}
	};
	return res;
}

export function createMockReq(init?: any) {
	return {
		body: {},
		params: {},
		query: {},
		header: () => undefined,
		...(init ?? {})
	};
}
