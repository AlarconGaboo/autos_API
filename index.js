const http = require('http');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/autos') {
    switch (req.method) {
      case 'GET':
        // Obtener autos
        try {
          const data = await fs.readFile('autos.txt', 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error al leer el archivo de autos');
        }
        break;

      case 'POST':
        // Agregar nuevo auto
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const newAuto = JSON.parse(body);  // Convertimos el body recibido en JSON
            let data;
            try {
              data = await fs.readFile('autos.txt', 'utf-8');
            } catch (error) {
              // Si el archivo no existe o está vacío, iniciamos con un objeto vacío
              data = '{}';
            }

            // Si el archivo tiene datos, lo convertimos a objeto JSON, si no, creamos uno vacío
            const autos = data ? JSON.parse(data) : {};

            const id = uuidv4(); // Generamos un ID único para el auto
            autos[id] = newAuto; // Agregamos el nuevo auto al objeto autos

            await fs.writeFile('autos.txt', JSON.stringify(autos, null, 2)); // Guardamos el objeto actualizado
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Auto agregado', id }));
          } catch (error) {
            console.error('Error en POST:', error); // Log para depurar
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error al agregar auto');
          }
        });
        break;

      case 'PUT':
        // Actualizar auto
        const updateId = url.searchParams.get('id');
        if (!updateId) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('ID es requerido para actualizar');
          break;
        }

        let updateBody = '';
        req.on('data', chunk => {
          updateBody += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const updatedAuto = JSON.parse(updateBody);
            const data = await fs.readFile('autos.txt', 'utf-8');
            const autos = JSON.parse(data);

            if (autos[updateId]) {
              autos[updateId] = { ...autos[updateId], ...updatedAuto };
              await fs.writeFile('autos.txt', JSON.stringify(autos, null, 2));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Auto actualizado', id: updateId }));
            } else {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('Auto no encontrado');
            }
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error al actualizar el auto');
          }
        });
        break;

      case 'DELETE':
        // Eliminar auto
        const deleteId = url.searchParams.get('id');
        if (!deleteId) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('ID es requerido para eliminar');
          break;
        }

        try {
          const data = await fs.readFile('autos.txt', 'utf-8');
          const autos = JSON.parse(data);

          if (autos[deleteId]) {
            delete autos[deleteId];
            await fs.writeFile('autos.txt', JSON.stringify(autos, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Auto eliminado', id: deleteId }));
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Auto no encontrado');
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error al eliminar el auto');
        }
        break;

      default:
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Método no permitido');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Ruta no encontrada');
  }
});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
