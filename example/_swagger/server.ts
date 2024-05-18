import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { setupSwagger, saveSwaggerSpec } from './swagger';
import path from 'path';

const server: Express = express();

// Enable CORS
server.use(cors());

const startServer = async () => {
    try {
        // Setup Swagger UI
        await setupSwagger(server);

        // Save Swagger Spec to file
        saveSwaggerSpec();

        // Serve the swagger.json file for download
        server.get('/swagger.json', (req: Request, res: Response) => {
            const swaggerPath = path.join(__dirname, '../public', 'swagger.json');
            res.download(swaggerPath, 'swagger.json', (err) => {
                if (err) {
                    res.status(500).send({ error: 'Failed to download file' });
                }
            });
        });

        const port = process.env.SWAGGER_PORT || 3001;
        server.listen(port, () => {
            console.log(`> Swagger server ready on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start Swagger server:', error);
    }
};

startServer();
