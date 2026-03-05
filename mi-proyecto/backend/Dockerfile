FROM node:18

WORKDIR /app

# Copiamos solo package.json primero
COPY package*.json ./

# Instalamos dependencias DENTRO del contenedor
RUN npm install

# Ahora copiamos el resto del código
COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npm install && node server.js"]