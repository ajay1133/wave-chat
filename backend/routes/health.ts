import express from 'express';
import { customRouteWrapper } from '../http/customRouteWrapper';

export function createHealthRouter() {
    const router = express.Router();

    router.get(
        '/health',
        customRouteWrapper((req, res) => {
            res.json({ ok: true });
        })
    );
    
    return router;
}
