FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code (initial copy)
COPY . .

EXPOSE 3000

# Use npm run dev instead of start for better development
CMD ["npm", "run", "dev"]