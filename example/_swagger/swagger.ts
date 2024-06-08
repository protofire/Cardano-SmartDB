
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { Express } from 'express';

// Define a function to load backend modules dynamically
const loadBackendModules = async () => {
    // const smartDbBackend = await import('smart-db/backEnd');
    // return smartDbBackend;
};

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Example SmartDB API',
        version: '1.0.0',
        description: 'API Documentation',
    },
    servers: [
        {
            url: process.env.NEXT_PUBLIC_REACT_SERVER_URL || 'http://localhost:3000',
            description: 'Local server',
        },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
};

const options = {
    swaggerDefinition,
    apis: [
        path.resolve(__dirname, '../src/pages/api/**/*.ts'),
        path.resolve(__dirname, '../src/**/BackEnd/**/*.ts'),
        path.resolve(__dirname, '../node_modules/smart-db/**/*.ts'),
        path.resolve(__dirname, '../node_modules/smart-db/**/*.js'),
    ],
};

const swaggerSpec = swaggerJsDoc(options);

// Debugging: Check the generated swaggerSpec
console.log(JSON.stringify(swaggerSpec, null, 2));

const setupSwagger = async (app: Express) => {
    // const smartDbBackend = await loadBackendModules();
    // const allEntities = smartDbBackend.RegistryManager.getAllFromEntitiesRegistry();

    // allEntities.forEach((entity: any) => {
    //     console.log(entity);
    // });

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

const saveSwaggerSpec = () => {
    const outputPath = path.join(__dirname, '../public', 'swagger.json');
    const dir = path.dirname(outputPath);

    // Ensure the directory exists
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
};

export { setupSwagger, saveSwaggerSpec, swaggerSpec };
