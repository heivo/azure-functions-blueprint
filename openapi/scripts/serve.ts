import express from 'express';
import swaggerUi from 'swagger-ui-dist';
import generate from '../generate';
import open from 'open';

const PORT = 3000;
const OPEN_API_FILENAME = 'open-api.json';

const pathToSwaggerUi = swaggerUi.absolutePath();

const app = express();

app.get('/' + OPEN_API_FILENAME, async (req, res) => {
  try {
    const json = await generate();
    res.type('application/json');
    res.send(json);
  } catch (err) {
    console.error(err);
    res.status(500);
    res.send('Failed to generate Open API document');
  }
});

app.get('/swagger-initializer.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "http://localhost:${PORT}/${OPEN_API_FILENAME}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };  
  `);
});

app.use(express.static(pathToSwaggerUi));

app.listen(3000, () => {
  console.log(`Starting Swagger UI on http://localhost:${PORT} ...`);
});

open(`http://localhost:${PORT}`);
