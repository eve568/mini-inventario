const express = require('express');
const path = require('node:path');

const app = express();
const publicDirectory = path.join(__dirname, 'public');
const port = Number(process.env.PORT) || 3000;

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use(express.static(publicDirectory));

app.listen(port, () => {
  console.log(`Mini Inventario disponible en http://localhost:${port}`);
});
